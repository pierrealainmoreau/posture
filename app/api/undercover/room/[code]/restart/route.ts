import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";
import { pickWordPair, RECENT_PAIRS_WINDOW } from "@/lib/undercover/word-pairs";
import { suggestRoles } from "@/lib/undercover/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const { playerId } = (await req.json()) as { playerId: string };

  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "undercover_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { data: room } = await admin
    .from("undercover_rooms")
    .select("id, host_player_id, status, session_count")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (room.host_player_id !== playerId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (room.status !== "finished") return NextResponse.json({ error: "La partie n\'est pas terminée" }, { status: 409 });

  const { data: players } = await admin
    .from("undercover_players")
    .select("id")
    .eq("room_id", room.id);

  const playerCount = (players ?? []).length;
  const newRoles = suggestRoles(playerCount);

  // Reset player states but keep total_score
  await admin
    .from("undercover_players")
    .update({ role: null, secret_word: null, is_eliminated: false })
    .eq("room_id", room.id);

  // Pick new word pair
  const { data: recentRooms } = await admin
    .from("undercover_rooms")
    .select("pair_index")
    .not("pair_index", "is", null)
    .order("created_at", { ascending: false })
    .limit(RECENT_PAIRS_WINDOW);

  const recentIndices = (recentRooms ?? [])
    .map((r) => r.pair_index as number)
    .filter((i) => i !== null);

  const { index: pairIndex } = await pickWordPair(recentIndices);

  const newSession = (room.session_count ?? 1) + 1;

  const { error } = await admin
    .from("undercover_rooms")
    .update({
      status: "lobby",
      civil_word: null,
      undercover_word: null,
      pair_index: pairIndex,
      nb_undercovers: newRoles.nbUndercovers,
      nb_mr_whites: newRoles.nbMrWhites,
      turn_order: [],
      current_turn_player_id: null,
      turn_started_at: null,
      discussion_started_at: null,
      round_number: 0,
      eliminated_player_id: null,
      mr_white_last_guess: null,
      mr_white_last_guess_correct: null,
      winner: null,
      session_count: newSession,
    })
    .eq("id", room.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
