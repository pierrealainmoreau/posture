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

// GET /api/admin/notifications — historique des broadcasts one-shot
export async function GET() {
  try {
    const admin = await assertAdmin();
    if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const sb = createAdminSupabaseClient();
    const { data, error } = await sb
      .from("notification_broadcasts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ broadcasts: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/admin/notifications — envoi one-shot (enregistre le broadcast + notifs)
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

    // Expiration à 7 jours
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Enregistre le broadcast
    const { data: broadcast, error: broadcastError } = await sb
      .from("notification_broadcasts")
      .insert({ title, body: body ?? null, type, href: href ?? null, target, sent_count: resolvedIds.length, expires_at: expiresAt })
      .select()
      .single();

    if (broadcastError) return NextResponse.json({ error: broadcastError.message }, { status: 500 });

    // Insère les notifications liées
    const rows = resolvedIds.map((uid) => ({
      user_id: uid,
      title,
      body: body ?? null,
      type,
      href: href ?? null,
      broadcast_id: broadcast.id,
      expires_at: expiresAt,
    }));
    const { error } = await sb.from("notifications").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, sent: rows.length, broadcast });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/admin/notifications — supprime un broadcast (cascade sur les notifs)
export async function DELETE(req: NextRequest) {
  try {
    const admin = await assertAdmin();
    if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { broadcastId } = await req.json();
    if (!broadcastId) return NextResponse.json({ error: "broadcastId requis" }, { status: 400 });

    const sb = createAdminSupabaseClient();
    const { error } = await sb.from("notification_broadcasts").delete().eq("id", broadcastId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
