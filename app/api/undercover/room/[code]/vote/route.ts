import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";
import { resolveVotes } from "@/lib/undercover/game-logic";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const { playerId, votedPlayerId } = (await req.json()) as {
    playerId: string;
    votedPlayerId: string;
  };

  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "undercover_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { data: room } = await admin
    .from("undercover_rooms")
    .select("id, status, round_number, session_count")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (room.status !== "voting") return NextResponse.json({ error: "Pas en phase de vote" }, { status: 409 });

  const { data: voter } = await admin
    .from("undercover_players")
    .select("id, is_eliminated")
    .eq("id", playerId)
    .eq("room_id", room.id)
    .single();

  if (!voter || voter.is_eliminated) {
    return NextResponse.json({ error: "Joueur éliminé ou introuvable" }, { status: 403 });
  }

  const { data: target } = await admin
    .from("undercover_players")
    .select("id, is_eliminated")
    .eq("id", votedPlayerId)
    .eq("room_id", room.id)
    .single();

  if (!target || target.is_eliminated) {
    return NextResponse.json({ error: "Cible invalide" }, { status: 400 });
  }

  if (playerId === votedPlayerId) {
    return NextResponse.json({ error: "Vous ne pouvez pas voter pour vous-même" }, { status: 400 });
  }

  await admin.from("undercover_votes").upsert({
    room_id: room.id,
    voter_player_id: playerId,
    voted_player_id: votedPlayerId,
    session_count: room.session_count,
    round_number: room.round_number,
  }, { onConflict: "room_id,voter_player_id,session_count,round_number" });

  // Auto-resolve when all active players have voted
  const { data: activePlayers } = await admin
    .from("undercover_players")
    .select("id")
    .eq("room_id", room.id)
    .eq("is_eliminated", false);

  const { data: votes } = await admin
    .from("undercover_votes")
    .select("voter_player_id")
    .eq("room_id", room.id)
    .eq("session_count", room.session_count)
    .eq("round_number", room.round_number);

  if ((votes ?? []).length >= (activePlayers ?? []).length) {
    await resolveVotes(admin, room.id);
  }

  return NextResponse.json({ ok: true }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
  });
}
