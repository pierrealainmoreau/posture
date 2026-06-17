import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

const VALID_ANSWERS = ["pilote", "dynamo", "socle", "repere"] as const;
type AnswerValue = (typeof VALID_ANSWERS)[number];

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  const body = await req.json().catch(() => ({})) as {
    playerId?: string;
    situationId?: string;
    answerValue?: string | null;
  };

  const { playerId, situationId, answerValue } = body;

  if (!playerId || !situationId) {
    return NextResponse.json({ error: "playerId et situationId requis" }, { status: 400 });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(situationId)) {
    return NextResponse.json({ error: "situationId invalide" }, { status: 400 });
  }

  if (answerValue !== null && answerValue !== undefined && !VALID_ANSWERS.includes(answerValue as AnswerValue)) {
    return NextResponse.json({ error: "answerValue invalide" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "boussole_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { data: room, error: roomError } = await admin
    .from("boussole_rooms")
    .select("id, status")
    .eq("code", code)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room introuvable" }, { status: 404 });
  }

  const { error: upsertError } = await admin
    .from("boussole_answers")
    .upsert(
      {
        room_id: room.id,
        player_id: playerId,
        situation_id: situationId,
        answer_value: answerValue ?? null,
        answered_at: new Date().toISOString(),
      },
      { onConflict: "player_id,situation_id" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
