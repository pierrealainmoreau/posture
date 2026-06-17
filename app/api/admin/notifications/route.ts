import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return user;
}

// POST /api/admin/notifications — envoi one-shot
export async function POST(req: NextRequest) {
  try {
    const admin = await assertAdmin();
    if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { title, body, type = "info", href, target, userIds } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

    if (target === "specific" && (!Array.isArray(userIds) || userIds.length === 0)) {
      return NextResponse.json({ error: "Sélectionnez au moins un destinataire" }, { status: 400 });
    }

    const sb = createAdminSupabaseClient();

    let resolvedIds: string[] = [];
    if (target === "all") {
      const { data: profiles } = await sb.from("profiles").select("id");
      resolvedIds = (profiles ?? []).map((p: { id: string }) => p.id);
    } else if (target === "premium") {
      const { data: profiles } = await sb.from("profiles").select("id").in("role", ["premium", "admin"]);
      resolvedIds = (profiles ?? []).map((p: { id: string }) => p.id);
    } else if (target === "admin") {
      const { data: profiles } = await sb.from("profiles").select("id").eq("role", "admin");
      resolvedIds = (profiles ?? []).map((p: { id: string }) => p.id);
    } else if (target === "specific" && Array.isArray(userIds)) {
      resolvedIds = userIds;
    }

    if (resolvedIds.length === 0) return NextResponse.json({ error: "Aucun destinataire" }, { status: 400 });

    const rows = resolvedIds.map((uid) => ({ user_id: uid, title, body: body ?? null, type, href: href ?? null }));
    const { error } = await sb.from("notifications").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, sent: rows.length });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
