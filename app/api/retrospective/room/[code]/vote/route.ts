import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";
import { RETRO_CRITERIA } from "@/lib/retrospective/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();
  const playerSecret = req.headers.get("X-Player-Secret") ?? "";
  const { playerId, votes, comment } = (await req.json()) as {
    playerId: string;
    votes: Record<string, number>;
    comment?: string;
  };

  const { data: room } = await admin
    .from("retro_rooms")
    .select("id, status")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (room.status !== "voting") return NextResponse.json({ error: "Vote non ouvert" }, { status: 409 });

  const isValid = await verifyPlayerSecret(admin, "retro_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const validCriterionIds = new Set(RETRO_CRITERIA.map((c) => c.id));

  const rows = Object.entries(votes)
    .filter(([criterionId, score]) =>
      validCriterionIds.has(criterionId) &&
      Number.isInteger(score) &&
      score >= 1 && score <= 5
    )
    .map(([criterionId, score]) => ({
      room_id: room.id,
      player_id: playerId,
      criterion: criterionId,
      score,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ error: "Aucun vote valide" }, { status: 400 });
  }

  const { error: voteErr } = await admin
    .from("retro_votes")
    .upsert(rows, { onConflict: "room_id,player_id,criterion" });

  if (voteErr) {
    return NextResponse.json({ error: voteErr.message }, { status: 500 });
  }

  if (comment !== undefined) {
    await admin
      .from("retro_players")
      .update({ comment: comment.trim() || null })
      .eq("id", playerId);
  }

  return NextResponse.json({ ok: true });
}
