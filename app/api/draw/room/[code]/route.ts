import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();

  const { data: room } = await admin
    .from("draw_rooms")
    .select("*")
    .eq("code", code)
    .single();

  if (!room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  const { data: players } = await admin
    .from("draw_players")
    .select("*")
    .eq("room_id", room.id)
    .order("joined_at");

  return NextResponse.json({ ...room, players: players ?? [] }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();
  const body = (await req.json()) as Record<string, unknown>;

  const { data: room } = await admin
    .from("draw_rooms")
    .select("id, host_player_id")
    .eq("code", code)
    .single();

  if (!room) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }
  if (body.playerId !== room.host_player_id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const allowed = [
    "status",
    "current_round",
    "current_drawer_player_id",
    "current_word",
    "word_choices",
    "round_started_at",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { error } = await admin
    .from("draw_rooms")
    .update(update)
    .eq("id", room.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
