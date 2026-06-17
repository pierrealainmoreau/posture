import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { playerId, word, turnIndex } = (await req.json()) as {
    playerId: string;
    word: string;
    turnIndex: number;
  };

  if (!word?.trim()) {
    return NextResponse.json({ error: "Mot manquant" }, { status: 400 });
  }
  const trimmed = word.trim();
  if (trimmed.length < 2) {
    return NextResponse.json({ error: "Mot trop court (minimum 2 caractères)" }, { status: 400 });
  }
  if (trimmed.length > 30) {
    return NextResponse.json({ error: "Mot trop long (maximum 30 caractères)" }, { status: 400 });
  }
  if (/\s/.test(trimmed)) {
    return NextResponse.json({ error: "Un seul mot à la fois" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "chaine_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const code = params.code.toUpperCase();

  const { data: room } = await admin
    .from("chaine_rooms")
    .select("id, status, current_turn_index, player_order")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  if (room.status !== "playing") return NextResponse.json({ error: "Partie non active" }, { status: 409 });

  // Idempotence: if turn already advanced, ignore
  if (room.current_turn_index !== turnIndex) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Verify it's this player's turn
  const expectedPlayerId = room.player_order[turnIndex - 1];
  if (expectedPlayerId !== playerId) {
    return NextResponse.json({ error: "Ce n'est pas ton tour" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const nextTurnIndex = turnIndex + 1;
  const isLastTurn = nextTurnIndex > room.player_order.length;

  const [{ error: wordErr }] = await Promise.all([
    admin.from("chaine_words").insert({
      room_id: room.id,
      player_id: playerId,
      turn_index: turnIndex,
      word: trimmed,
    }),
  ]);

  if (wordErr) return NextResponse.json({ error: wordErr.message }, { status: 500 });

  const { error: updateErr } = await admin
    .from("chaine_rooms")
    .update({
      current_turn_index: nextTurnIndex,
      turn_started_at: isLastTurn ? null : now,
      status: isLastTurn ? "voting" : "playing",
    })
    .eq("id", room.id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, finished: isLastTurn });
}
