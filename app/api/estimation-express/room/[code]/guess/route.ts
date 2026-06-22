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
    const { value } = await req.json() as { value: number };

    if (value === undefined || value === null) {
      return NextResponse.json({ error: "Valeur requise" }, { status: 400 });
    }

    const ok = await verifyPlayerSecret(admin, "estimation_express_players", playerId, secret);
    if (!ok) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const { data: room } = await admin
      .from("estimation_express_rooms")
      .select("id, status, current_question_index, questions, total_questions")
      .eq("code", code)
      .single();

    if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    if (room.status !== "playing") return NextResponse.json({ error: "Pas en phase de jeu" }, { status: 409 });

    const qIdx = room.current_question_index as number;
    const questions = room.questions as EEQuestion[];
    const question = questions[qIdx];

    if (!question) return NextResponse.json({ error: "Question introuvable" }, { status: 400 });

    const { error: insertErr } = await admin
      .from("estimation_express_guesses")
      .insert({ room_id: room.id, question_index: qIdx, player_id: playerId, value, points_earned: 0 });

    if (insertErr) {
      if (insertErr.message.includes("unique")) {
        return NextResponse.json({ error: "Déjà répondu" }, { status: 409 });
      }
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Check if all players have answered → auto-reveal
    const { data: players } = await admin
      .from("estimation_express_players")
      .select("id")
      .eq("room_id", room.id);

    const { data: guesses } = await admin
      .from("estimation_express_guesses")
      .select("player_id")
      .eq("room_id", room.id)
      .eq("question_index", qIdx);

    const playerCount = (players ?? []).length;
    const guessCount = (guesses ?? []).length;

    if (guessCount >= playerCount) {
      await admin
        .from("estimation_express_rooms")
        .update({ status: "reveal", phase_started_at: new Date().toISOString() })
        .eq("id", room.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/estimation-express/room/[code]/guess]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
