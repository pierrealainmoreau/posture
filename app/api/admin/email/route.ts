import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { buildBroadcastHtml, buildUnsubscribeUrl, type EmailBlock } from "@/lib/email";

const FROM = "L'équipe Posture <no-reply@posture.pamoreau.xyz>";

async function getAuthedAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return null;
  return { user };
}

function makeTargetLabel(target: string, userIds: string[]): string {
  if (target === "premium") return "Premium et Admin";
  if (target === "specific") return `${userIds.length} utilisateur(s) sélectionné(s)`;
  return "Tous les utilisateurs";
}

export async function GET() {
  try {
    const authed = await getAuthedAdmin();
    if (!authed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("email_broadcasts")
      .select("id, created_at, subject, blocks, target, target_label, sent_count, opens, clicks")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      if (error.code === "42P01") return NextResponse.json([]);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authed = await getAuthedAdmin();
    if (!authed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const body = await req.json() as {
      subject?: string;
      blocks?: EmailBlock[];
      target?: string;
      userIds?: string[];
    };

    if (!body.subject?.trim()) {
      return NextResponse.json({ error: "Sujet requis" }, { status: 400 });
    }
    if (!Array.isArray(body.blocks) || body.blocks.length === 0) {
      return NextResponse.json({ error: "Contenu requis (au moins un bloc)" }, { status: 400 });
    }
    if (body.target === "specific" && (!Array.isArray(body.userIds) || body.userIds.length === 0)) {
      return NextResponse.json({ error: "Aucun utilisateur sélectionné" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://posture.pamoreau.xyz";
    const subject = body.subject.trim();
    const blocks = body.blocks;
    const target = body.target ?? "all";
    const userIds = body.userIds ?? [];

    // ── 1. Pré-insérer l'enregistrement pour obtenir l'ID de tracking ──────────
    let broadcastId: string | null = null;
    try {
      const { data } = await admin
        .from("email_broadcasts")
        .insert({
          subject,
          blocks,
          target,
          target_label: makeTargetLabel(target, userIds),
          sent_count: 0,
          sent_by: authed.user.id,
        })
        .select("id")
        .single();
      broadcastId = data?.id ?? null;
    } catch { /* migration not yet applied — tracking disabled */ }

    // ── 2. Résoudre les destinataires ─────────────────────────────────────────
    let withOptInColumn = admin.from("profiles").select("id, first_name, email, newsletter_opt_in").not("email", "is", null);
    if (target === "premium") withOptInColumn = withOptInColumn.in("role", ["premium", "admin"]);
    else if (target === "specific" && userIds.length) withOptInColumn = withOptInColumn.in("id", userIds);

    const profilesRes = await withOptInColumn;
    const authUsers: Array<{ id: string; email_confirmed_at?: string | null }> = [];
    {
      let page = 1;
      const perPage = 1000;
      for (;;) {
        const { data } = await admin.auth.admin.listUsers({ page, perPage });
        const users = data?.users ?? [];
        authUsers.push(...users);
        if (users.length < perPage) break;
        page++;
      }
    }

    let profiles: { id: string; first_name: string | null; email: string | null; newsletter_opt_in?: boolean }[] | null = profilesRes.data;
    let profilesErr = profilesRes.error;

    if (profilesErr?.code === "42703") {
      // Migration newsletter_opt_in pas encore appliquée — pas de filtrage opt-out possible
      let withoutOptInColumn = admin.from("profiles").select("id, first_name, email").not("email", "is", null);
      if (target === "premium") withoutOptInColumn = withoutOptInColumn.in("role", ["premium", "admin"]);
      else if (target === "specific" && userIds.length) withoutOptInColumn = withoutOptInColumn.in("id", userIds);
      const retry = await withoutOptInColumn;
      profiles = retry.data;
      profilesErr = retry.error;
    }

    if (profilesErr) return NextResponse.json({ error: profilesErr.message }, { status: 500 });

    const confirmedIds = new Set(
      authUsers.filter((u) => u.email_confirmed_at).map((u) => u.id),
    );

    const targets = (profiles ?? []).filter((p) => {
      if (!p.email) return false;
      if ("newsletter_opt_in" in p && p.newsletter_opt_in === false) return false;
      return target === "specific" ? true : confirmedIds.has(p.id);
    });

    if (targets.length === 0) {
      if (broadcastId) {
        try { await admin.from("email_broadcasts").delete().eq("id", broadcastId); } catch { /* noop */ }
      }
      return NextResponse.json({ sent: 0 });
    }

    // ── 3. Créer la liste des destinataires (pour le détail des stats) ─────────
    if (broadcastId) {
      try {
        await admin.from("email_broadcast_recipients").insert(
          targets.map((u) => ({
            broadcast_id: broadcastId,
            user_id: u.id,
            email: u.email,
            first_name: u.first_name,
          })),
        );
      } catch { /* migration not yet applied — per-recipient detail disabled */ }
    }

    // ── 4. Envoyer via Resend (avec tracking si broadcastId disponible) ────────
    const resend = new Resend(process.env.RESEND_API_KEY);
    let sent = 0;
    const errors: string[] = [];

    for (let i = 0; i < targets.length; i += 100) {
      const chunk = targets.slice(i, i + 100);
      try {
        const { error } = await resend.batch.send(
          chunk.map((u) => ({
            from: FROM,
            reply_to: "pierrealainmoreau@gmail.com",
            to: [u.email as string],
            subject,
            html: buildBroadcastHtml(
              u.first_name ?? "vous",
              blocks,
              appUrl,
              buildUnsubscribeUrl(u.id, appUrl),
              broadcastId ? { broadcastId, userId: u.id } : undefined,
            ),
          })),
        );
        if (error) {
          errors.push(typeof error === "object" && "message" in error ? (error as { message: string }).message : String(error));
        } else {
          sent += chunk.length;
        }
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "Erreur inconnue");
      }
    }

    if (errors.length > 0 && sent === 0) {
      if (broadcastId) {
        try { await admin.from("email_broadcasts").delete().eq("id", broadcastId); } catch { /* noop */ }
      }
      return NextResponse.json({ error: errors[0] }, { status: 500 });
    }

    // ── 5. Mettre à jour le compteur d'envois ─────────────────────────────────
    if (broadcastId) {
      try {
        await admin
          .from("email_broadcasts")
          .update({ sent_count: sent, target_label: makeTargetLabel(target, userIds) })
          .eq("id", broadcastId);
      } catch { /* noop */ }
    }

    return NextResponse.json({ sent, ...(errors.length > 0 && { warnings: errors }) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur serveur" }, { status: 500 });
  }
}
