import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";
import type { PlayerRole } from "@/lib/undercover/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const url = new URL(req.url);
  const playerId = url.searchParams.get("playerId") ?? "";
  const playerSecret = req.headers.get("X-Player-Secret") ?? "";

  const admin = createAdminSupabaseClient();

  const { data: room } = await admin
    .from("undercover_rooms")
    .select("*")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const { data: players } = await admin
    .from("undercover_players")
    .select("id, room_id, pseudo, avatar_color, is_host, role, secret_word, is_eliminated, total_score, joined_at")
    .eq("room_id", room.id)
    .order("joined_at");

  const { data: descriptions } = await admin
    .from("undercover_descriptions")
    .select("id, room_id, player_id, session_count, round_number, word, submitted_at")
    .eq("room_id", room.id)
    .eq("session_count", room.session_count);

  const { data: votes } = await admin
    .from("undercover_votes")
    .select("id, room_id, voter_player_id, voted_player_id, session_count, round_number")
    .eq("room_id", room.id)
    .eq("session_count", room.session_count);

  // Verify identity to personalize secret info
  let myRole: PlayerRole | null = null;
  let myWord: string | null = null;

  if (playerId) {
    const isValid = await verifyPlayerSecret(admin, "undercover_players", playerId, playerSecret);
    if (isValid) {
      const me = (players ?? []).find((p) => p.id === playerId);
      if (me) {
        myRole = me.role as PlayerRole | null;
        myWord = me.secret_word;
      }
    }
  }

  const gameOver = room.status === "finished";

  // Sanitize players: hide roles/words during the game
  const sanitizedPlayers = (players ?? []).map((p) => ({
    ...p,
    role: gameOver ? p.role : null,
    secret_word: gameOver ? p.secret_word : null,
  }));

  return NextResponse.json(
    {
      ...room,
      my_role: myRole,
      my_word: myWord,
      players: sanitizedPlayers,
      descriptions: descriptions ?? [],
      votes: votes ?? [],
    },
    {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    }
  );
}
