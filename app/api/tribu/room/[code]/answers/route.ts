import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) return NextResponse.json([], { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: room } = await admin
    .from("tribu_rooms")
    .select("id")
    .eq("code", params.code.toUpperCase())
    .single();
  if (!room) return NextResponse.json([]);

  const { data } = await admin
    .from("tribu_answers")
    .select("question_id, answer_value")
    .eq("room_id", room.id)
    .eq("player_id", playerId);

  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { playerId, questionId, answerValue } = (await req.json()) as {
    playerId: string;
    questionId: string;
    answerValue: string;
  };

  if (!playerId || !questionId || !answerValue) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "tribu_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const { data: room } = await admin
    .from("tribu_rooms")
    .select("id, status")
    .eq("code", params.code.toUpperCase())
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (room.status !== "playing") {
    return NextResponse.json({ error: "Partie non en cours" }, { status: 409 });
  }

  // Validate player belongs to room
  const { data: player } = await admin
    .from("tribu_players")
    .select("id")
    .eq("id", playerId)
    .eq("room_id", room.id)
    .single();
  if (!player) return NextResponse.json({ error: "Joueur inconnu" }, { status: 403 });

  const { error } = await admin
    .from("tribu_answers")
    .upsert(
      { room_id: room.id, player_id: playerId, question_id: questionId, answer_value: answerValue },
      { onConflict: "player_id,question_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
