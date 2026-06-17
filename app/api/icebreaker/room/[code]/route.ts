import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const AUTO_CLOSE_MS = 60 * 60 * 1000; // 1 heure

// GET — public room info (no auth required)
export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } },
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();

  const { data: room, error } = await admin
    .from("icebreaker_rooms")
    .select("id, code, is_active, created_at, creator_user_id, phase, participants, launched_at")
    .eq("code", code)
    .single();

  if (error || !room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  // Auto-close si lancée depuis plus d'1h et encore ouverte
  let isActive = room.is_active;
  if (isActive && room.launched_at) {
    const elapsed = Date.now() - new Date(room.launched_at).getTime();
    if (elapsed >= AUTO_CLOSE_MS) {
      await admin
        .from("icebreaker_rooms")
        .update({ is_active: false })
        .eq("id", room.id);
      isActive = false;
    }
  }

  const [{ count }, { data: profile }] = await Promise.all([
    admin
      .from("icebreaker_room_anecdotes")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id)
      .eq("is_approved", true),
    admin
      .from("profiles")
      .select("first_name")
      .eq("id", room.creator_user_id)
      .single(),
  ]);

  return NextResponse.json({
    ...room,
    is_active:     isActive,
    approved_count: count ?? 0,
    creator_name:  profile?.first_name ?? null,
    phase:         room.phase ?? "collecting",
    participants:  room.participants ?? [],
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    },
  });
}

// PATCH — close / reopen room (host only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const userId = user.id;

  const code = params.code.toUpperCase();
  const body = await req.json();

  const admin = createAdminSupabaseClient();

  const { data: room } = await admin
    .from("icebreaker_rooms")
    .select("id, creator_user_id")
    .eq("code", code)
    .single();

  if (!room || room.creator_user_id !== userId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.is_active === "boolean") update.is_active = body.is_active;
  if (typeof body.phase === "string") {
    update.phase = body.phase;
    // Démarre le chrono de fermeture automatique au lancement du vote
    if (body.phase === "voting:0") update.launched_at = new Date().toISOString();
  }

  const { error } = await admin
    .from("icebreaker_rooms")
    .update(update)
    .eq("id", room.id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
