import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { sendSuggestionEmail, type SuggestionStatus } from "@/lib/email";
import { dispatchNotificationTrigger } from "@/lib/notifications/dispatch";

// POST — utilisateur authentifié soumet une suggestion
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { category?: string; message?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const message = body.message?.trim() ?? "";
  const category = body.category?.trim() ?? "general";

  if (message.length < 10) return NextResponse.json({ error: "Message trop court (10 caractères min.)" }, { status: 400 });
  if (message.length > 2000) return NextResponse.json({ error: "Message trop long (2000 caractères max.)" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("suggestions").insert({ user_id: user.id, category, message });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// GET — admin uniquement
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("suggestions")
    .select("id, category, message, created_at, status, email_sent_at, rejection_reason, user_id, profiles(first_name, last_name, email)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// PATCH — update status + optionally send email (admin only)
export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id, status, notify, rejection_reason } = await req.json() as {
    id: string;
    status: SuggestionStatus;
    notify: boolean;
    rejection_reason?: string;
  };

  const VALID_STATUSES: SuggestionStatus[] = ["planned", "done", "rejected"];
  if (!id || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const updatePayload: Record<string, unknown> = { status };
  if (status === "rejected") {
    updatePayload.rejection_reason = rejection_reason?.trim() ?? null;
  }

  const { error: updateErr } = await admin
    .from("suggestions")
    .update(updatePayload)
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  const { data: suggestionRow } = await admin
    .from("suggestions")
    .select("user_id")
    .eq("id", id)
    .single();
  if (suggestionRow?.user_id) {
    await dispatchNotificationTrigger("suggestion_answered", { userId: suggestionRow.user_id });
  }

  // Send email if requested, then mark it as sent only on success
  if (notify) {
    const { data: suggestion } = await admin
      .from("suggestions")
      .select("message, profiles(first_name, email)")
      .eq("id", id)
      .single();

    if (suggestion?.profiles) {
      const raw = suggestion.profiles;
      const p = (Array.isArray(raw) ? raw[0] : raw) as { first_name: string; email: string };
      try {
        await sendSuggestionEmail({
          to:        p.email,
          firstName: p.first_name,
          excerpt:   suggestion.message,
          status:    status as "planned" | "done",
          appUrl:    process.env.NEXT_PUBLIC_APP_URL ?? "https://posture.pamoreau.xyz",
        });
        // Only stamp email_sent_at after confirmed delivery
        await admin
          .from("suggestions")
          .update({ email_sent_at: new Date().toISOString() })
          .eq("id", id);
      } catch (emailErr) {
        // Status updated, email failed — email_sent_at intentionally left null
        return NextResponse.json({ ok: true, emailError: String(emailErr) });
      }
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE — supprime une suggestion (admin uniquement)
export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "Paramètre manquant" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("suggestions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
