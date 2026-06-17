import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();

  const { data: room } = await admin
    .from("draw_rooms")
    .select("id, code, status, rounds_total, current_round, creator_user_id, created_at")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (room.creator_user_id !== user.id)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const [
    { data: players },
    { data: rounds },
    { data: strokes },
    { data: guesses },
  ] = await Promise.all([
    admin
      .from("draw_players")
      .select("id, pseudo, avatar_color, score, is_host")
      .eq("room_id", room.id)
      .order("score", { ascending: false }),
    admin
      .from("draw_round_history")
      .select("round_number, drawer_player_id, word")
      .eq("room_id", room.id)
      .order("round_number"),
    admin
      .from("draw_strokes")
      .select("round_number, stroke_data")
      .eq("room_id", room.id)
      .order("created_at"),
    admin
      .from("draw_guesses")
      .select("player_id, round_number, points_earned")
      .eq("room_id", room.id)
      .eq("is_correct", true)
      .order("created_at"),
  ]);

  const enrichedRounds = (rounds ?? []).map((r) => ({
    round_number: r.round_number,
    drawer_player_id: r.drawer_player_id,
    word: r.word,
    strokes: (strokes ?? [])
      .filter((s) => s.round_number === r.round_number)
      .map((s) => s.stroke_data),
    correct_guesses: (guesses ?? [])
      .filter((g) => g.round_number === r.round_number),
  }));

  return NextResponse.json({
    room: {
      id: room.id,
      code: room.code,
      status: room.status,
      rounds_total: room.rounds_total,
      current_round: room.current_round,
      created_at: room.created_at,
    },
    players: players ?? [],
    rounds: enrichedRounds,
  });
}
