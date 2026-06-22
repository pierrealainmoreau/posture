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
      .select("id, host_player_id, status, current_question_index, total_questions, questions")
      .eq("code", code)
      .single();

    if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    if (room.host_player_id !== playerId) return NextResponse.json({ error: "Hôte uniquement" }, { status: 403 });
    if (room.status !== "reveal") return NextResponse.json({ error: "Pas en phase reveal" }, { status: 409 });

    const questions = room.questions as EEQuestion[];
    const nextIdx = (room.current_question_index as number) + 1;

    if (nextIdx >= questions.length) {
      await admin
        .from("estimation_express_rooms")
        .update({ status: "finished" })
        .eq("id", room.id);
      return NextResponse.json({ finished: true });
    }

    await admin
      .from("estimation_express_rooms")
      .update({ status: "playing", current_question_index: nextIdx, phase_started_at: new Date().toISOString() })
      .eq("id", room.id);

    return NextResponse.json({ ok: true, nextIndex: nextIdx });
  } catch (err) {
    console.error("[POST /api/estimation-express/room/[code]/next]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
