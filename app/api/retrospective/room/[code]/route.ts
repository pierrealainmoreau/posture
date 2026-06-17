import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { RETRO_CRITERIA } from "@/lib/retrospective/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();

  const { data: room, error: roomErr } = await admin
    .from("retro_rooms")
    .select("*")
    .eq("code", code)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  const { data: rawPlayers } = await admin
    .from("retro_players")
    .select("id, room_id, pseudo, avatar_color, is_host, comment, joined_at")
    .eq("room_id", room.id)
    .order("joined_at", { ascending: true });

  const players = rawPlayers ?? [];

  // Count how many criteria each player has voted on
  const { data: votes } = await admin
    .from("retro_votes")
    .select("player_id, criterion, score")
    .eq("room_id", room.id);

  const allVotes = votes ?? [];

  const playersWithVoteCount = players.map((p) => ({
    ...p,
    vote_count: allVotes.filter((v) => v.player_id === p.id).length,
  }));

  // When finished, compute averages per criterion
  let averages: Record<string, number> | null = null;
  let comments: Array<{ pseudo: string; comment: string; avatar_color: string }> | null = null;

  if (room.status === "finished") {
    averages = {};
    for (const criterion of RETRO_CRITERIA) {
      const criterionVotes = allVotes.filter((v) => v.criterion === criterion.id);
      if (criterionVotes.length > 0) {
        const avg = criterionVotes.reduce((sum, v) => sum + v.score, 0) / criterionVotes.length;
        averages[criterion.id] = Math.round(avg * 10) / 10;
      } else {
        averages[criterion.id] = 0;
      }
    }

    comments = players
      .filter((p) => p.comment?.trim())
      .map((p) => ({ pseudo: p.pseudo, comment: p.comment!, avatar_color: p.avatar_color }));
  }

  return NextResponse.json(
    { ...room, players: playersWithVoteCount, averages, comments },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
      },
    }
  );
}
