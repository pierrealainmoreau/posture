import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TOTAL_POINTS = 3;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();
  const { playerId, contributionId, points } = await req.json() as {
    playerId: string;
    contributionId: string;
    points: number; // 0 = remove vote, 1-3 = set points
  };

  if (points < 0 || points > 3) return NextResponse.json({ error: "Points invalides (0–3)" }, { status: 400 });

  const { data: room } = await admin
    .from("abcde_rooms")
    .select("id, status")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (room.status !== "step_c") return NextResponse.json({ error: "Vote uniquement possible à l'étape C" }, { status: 409 });

  if (points === 0) {
    await admin
      .from("abcde_votes")
      .delete()
      .eq("player_id", playerId)
      .eq("contribution_id", contributionId);
    return NextResponse.json({ ok: true });
  }

  // Check total existing points for this player (excluding this contribution)
  const { data: existingVotes } = await admin
    .from("abcde_votes")
    .select("points, contribution_id")
    .eq("room_id", room.id)
    .eq("player_id", playerId);

  const currentOnOther = (existingVotes ?? [])
    .filter((v) => v.contribution_id !== contributionId)
    .reduce((s, v) => s + v.points, 0);

  if (currentOnOther + points > TOTAL_POINTS) {
    return NextResponse.json(
      { error: `Total de points dépassé (max ${TOTAL_POINTS})`, remaining: TOTAL_POINTS - currentOnOther },
      { status: 422 }
    );
  }

  await admin
    .from("abcde_votes")
    .upsert(
      { room_id: room.id, player_id: playerId, contribution_id: contributionId, points },
      { onConflict: "player_id,contribution_id" }
    );

  return NextResponse.json({ ok: true });
}
