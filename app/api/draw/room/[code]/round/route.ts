import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { pickRandomWords } from "@/lib/draw/words";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const body = (await req.json()) as {
    action: string;
    playerId: string;
    word?: string;
  };
  const { action, playerId, word } = body;
  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "draw_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const code = params.code.toUpperCase();

  const { data: room } = await admin
    .from("draw_rooms")
    .select("*")
    .eq("code", code)
    .single();
  if (!room) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

  // ── SELECT WORD ─────────────────────────────────────────────────────────────
  if (action === "select_word") {
    if (room.current_drawer_player_id !== playerId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    const choices = room.word_choices as string[] | null;
    const selectedWord = word ?? choices?.[0] ?? "dessin";
    const { error } = await admin
      .from("draw_rooms")
      .update({
        current_word: selectedWord,
        round_started_at: new Date().toISOString(),
        word_choices: null,
      })
      .eq("id", room.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Persist round history (word + drawer) for session replay
    await admin.from("draw_round_history").upsert(
      {
        room_id: room.id,
        round_number: room.current_round as number,
        drawer_player_id: room.current_drawer_player_id as string,
        word: selectedWord,
      },
      { onConflict: "room_id,round_number" }
    );

    return NextResponse.json({ ok: true });
  }

  // ── NEXT ROUND ──────────────────────────────────────────────────────────────
  if (action === "next_round") {
    if (room.host_player_id !== playerId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { data: players } = await admin
      .from("draw_players")
      .select("id")
      .eq("room_id", room.id)
      .order("joined_at");

    const playerIds = (players ?? []).map((p: { id: string }) => p.id);
    if (playerIds.length === 0) {
      return NextResponse.json({ error: "Aucun joueur actif" }, { status: 409 });
    }
    const currentDrawerId = room.current_drawer_player_id as string | null;
    const currentIdx = playerIds.indexOf(currentDrawerId ?? "");
    const nextIdx = (currentIdx + 1) % playerIds.length;
    const nextDrawerId = playerIds[nextIdx];
    const isNewRound = nextIdx === 0;
    const currentRound = room.current_round as number;
    const roundsTotal = room.rounds_total as number;
    const nextRound = isNewRound ? currentRound + 1 : currentRound;

    // Check if game finished
    if (isNewRound && currentRound >= roundsTotal) {
      await admin
        .from("draw_rooms")
        .update({ status: "finished" })
        .eq("id", room.id);
      return NextResponse.json({ ok: true, finished: true });
    }

    const wordChoices = pickRandomWords(room.word_theme as string, 3);

    const { error } = await admin
      .from("draw_rooms")
      .update({
        current_round: nextRound,
        current_drawer_player_id: nextDrawerId,
        current_word: null,
        word_choices: wordChoices,
        round_started_at: null,
      })
      .eq("id", room.id)
      .eq("current_round", currentRound);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, finished: false });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
