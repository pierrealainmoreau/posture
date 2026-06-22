import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";
import { EEQuestion } from "@/lib/estimation-express/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const admin = createAdminSupabaseClient();
    const code = params.code.toUpperCase();
    const playerId = req.headers.get("X-Player-Id") ?? "";
    const secret = req.headers.get("X-Player-Secret");

    const ok = await verifyPlayerSecret(admin, "estimation_express_players", playerId, secret);
    if (!ok) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const { data: room } = await admin
      .from("estimation_express_rooms")
      .select("id, host_player_id, status, current_question_index, questions")
      .eq("code", code)
      .single();

    if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    if (room.host_player_id !== playerId) return NextResponse.json({ error: "Hôte uniquement" }, { status: 403 });
    if (room.status !== "reveal") return NextResponse.json({ error: "Pas en phase reveal" }, { status: 409 });

    const qIdx = room.current_question_index as number;
    const questions = room.questions as EEQuestion[];
    const question = questions[qIdx];

    if (!question) return NextResponse.json({ error: "Question introuvable" }, { status: 400 });

    const { data: guesses } = await admin
      .from("estimation_express_guesses")
      .select("id, player_id, value")
      .eq("room_id", room.id)
      .eq("question_index", qIdx);

    if (!guesses?.length) return NextResponse.json({ ok: true });

    const answer = question.answer;

    // Sort by absolute distance from answer
    const ranked = [...guesses].sort((a, b) => Math.abs(a.value - answer) - Math.abs(b.value - answer));

    const pointsMap: Record<string, number> = { 0: 3, 1: 2, 2: 1 };

    for (let i = 0; i < ranked.length; i++) {
      const g = ranked[i];
      const isExact = g.value === answer;
      const basePoints = pointsMap[i] ?? 0;
      const bonus = isExact ? 5 : 0;
      const total = basePoints + bonus;

      if (total > 0) {
        await admin
          .from("estimation_express_guesses")
          .update({ points_earned: total })
          .eq("id", g.id);

        await admin.rpc("increment_estimation_express_score", {
          p_player_id: g.player_id,
          p_points: total,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/estimation-express/room/[code]/reveal]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
