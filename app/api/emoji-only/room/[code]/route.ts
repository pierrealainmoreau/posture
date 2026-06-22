import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { ENCODE_SECONDS, GUESS_SECONDS } from "@/lib/emoji-only/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Pragma": "no-cache",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const admin = createAdminSupabaseClient();
    const code = params.code.toUpperCase();

    const { data: room, error: roomErr } = await admin
      .from("emoji_only_rooms")
      .select("*")
      .eq("code", code)
      .single();

    if (roomErr || !room) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    // Auto-advance expired timers
    if (room.phase_started_at && room.status === "encoding") {
      const elapsed = (Date.now() - new Date(room.phase_started_at).getTime()) / 1000;
      if (elapsed > ENCODE_SECONDS + 3) {
        // Encoder ran out of time — skip to guessing with empty emoji (no options = skip round)
        await admin
          .from("emoji_only_rooms")
          .update({ status: "reveal", phase_started_at: new Date().toISOString() })
          .eq("id", room.id);
        room.status = "reveal";
        room.phase_started_at = new Date().toISOString();
      }
    }

    if (room.phase_started_at && room.status === "guessing") {
      const elapsed = (Date.now() - new Date(room.phase_started_at).getTime()) / 1000;
      if (elapsed > GUESS_SECONDS + 3) {
        await admin
          .from("emoji_only_rooms")
          .update({ status: "reveal", phase_started_at: new Date().toISOString() })
          .eq("id", room.id);
        room.status = "reveal";
        room.phase_started_at = new Date().toISOString();
      }
    }

    const { data: players } = await admin
      .from("emoji_only_players")
      .select("id, room_id, pseudo, avatar_color, is_host, score, is_active, joined_at")
      .eq("room_id", room.id)
      .order("joined_at", { ascending: true });

    // Current round data (without revealing the word to guessers)
    let currentRound = null;
    let guesses = null;

    if (room.current_round > 0) {
      const { data: roundData } = await admin
        .from("emoji_only_rounds")
        .select("id, round_number, encoder_player_id, emoji_sequence, options, correct_option, encoding_started_at, guessing_started_at, revealed_at")
        .eq("room_id", room.id)
        .eq("round_number", room.current_round)
        .single();

      currentRound = roundData;

      if (roundData) {
        const { data: guessData } = await admin
          .from("emoji_only_guesses")
          .select("player_id, chosen_option, is_correct, points_earned, submitted_at")
          .eq("round_id", roundData.id);
        guesses = guessData ?? [];
      }
    }

    return NextResponse.json(
      { ...room, players: players ?? [], currentRound, guesses },
      { headers: NO_CACHE }
    );
  } catch (err) {
    console.error("[GET /api/emoji-only/room/[code]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const admin = createAdminSupabaseClient();
    const code = params.code.toUpperCase();
    const playerSecret = req.headers.get("X-Player-Secret");
    const { playerId } = await req.json() as { playerId: string };

    const { data: room } = await admin
      .from("emoji_only_rooms")
      .select("id, host_player_id")
      .eq("code", code)
      .single();

    if (!room) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

    if (room.host_player_id !== playerId || !playerSecret) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    await admin.from("emoji_only_rooms").delete().eq("id", room.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/emoji-only/room/[code]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
