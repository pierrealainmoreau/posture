import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, chosenOption } = await req.json() as {
      playerId: string;
      chosenOption: string;
    };

    const admin = createAdminSupabaseClient();
    const playerSecret = req.headers.get("X-Player-Secret");
    const isValid = await verifyPlayerSecret(admin, "emoji_only_players", playerId, playerSecret);
    if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const { data: room } = await admin
      .from("emoji_only_rooms")
      .select("id, status, current_round, current_encoder_player_id")
      .eq("code", params.code.toUpperCase())
      .single();

    if (!room) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    if (room.status !== "guessing") return NextResponse.json({ error: "Phase incorrecte" }, { status: 409 });
    if (room.current_encoder_player_id === playerId) {
      return NextResponse.json({ error: "L'encodeur ne peut pas voter" }, { status: 403 });
    }

    const { data: round } = await admin
      .from("emoji_only_rounds")
      .select("id, correct_option, guessing_started_at")
      .eq("room_id", room.id)
      .eq("round_number", room.current_round)
      .single();

    if (!round) return NextResponse.json({ error: "Round introuvable" }, { status: 404 });

    // Check if player already guessed
    const { data: existingGuess } = await admin
      .from("emoji_only_guesses")
      .select("id")
      .eq("round_id", round.id)
      .eq("player_id", playerId)
      .single();

    if (existingGuess) return NextResponse.json({ error: "Déjà répondu" }, { status: 409 });

    const isCorrect = chosenOption === round.correct_option;

    // Count prior correct guesses to determine points
    let points = 0;
    if (isCorrect) {
      const { count } = await admin
        .from("emoji_only_guesses")
        .select("id", { count: "exact", head: true })
        .eq("round_id", round.id)
        .eq("is_correct", true);

      const rank = (count ?? 0) + 1;
      points = rank === 1 ? 3 : rank === 2 ? 2 : rank === 3 ? 1 : 0;
    }

    await admin.from("emoji_only_guesses").insert({
      round_id: round.id,
      player_id: playerId,
      chosen_option: chosenOption,
      is_correct: isCorrect,
      points_earned: points,
      submitted_at: new Date().toISOString(),
    });

    if (points > 0) {
      await admin.rpc("increment_emoji_only_score", { p_player_id: playerId, p_points: points });
    }

    // Check if all active guessers have answered
    const { data: allPlayers } = await admin
      .from("emoji_only_players")
      .select("id")
      .eq("room_id", room.id)
      .eq("is_active", true);

    const guessers = (allPlayers ?? []).filter((p) => p.id !== room.current_encoder_player_id);
    const { count: guessCount } = await admin
      .from("emoji_only_guesses")
      .select("id", { count: "exact", head: true })
      .eq("round_id", round.id);

    if ((guessCount ?? 0) >= guessers.length) {
      // Give encoder bonus points (1 per correct guesser)
      if (isCorrect || (guessCount ?? 0) >= guessers.length) {
        const { count: correctCount } = await admin
          .from("emoji_only_guesses")
          .select("id", { count: "exact", head: true })
          .eq("round_id", round.id)
          .eq("is_correct", true);

        if ((correctCount ?? 0) > 0) {
          await admin.rpc("increment_emoji_only_score", {
            p_player_id: room.current_encoder_player_id,
            p_points: correctCount ?? 0,
          });
        }
      }

      await admin.from("emoji_only_rooms").update({
        status: "reveal",
        phase_started_at: new Date().toISOString(),
      }).eq("id", room.id);
    }

    return NextResponse.json({ ok: true, isCorrect, points });
  } catch (err) {
    console.error("[POST /api/emoji-only/room/[code]/guess]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
