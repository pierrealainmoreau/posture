import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { computeGuesserPoints } from "@/lib/draw/scoring";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeGuess(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const { searchParams } = new URL(req.url);
  const round = parseInt(searchParams.get("round") ?? "0");

  const { data: room } = await admin
    .from("draw_rooms")
    .select("id")
    .eq("code", params.code.toUpperCase())
    .single();
  if (!room) return NextResponse.json([]);

  const baseQuery = admin
    .from("draw_guesses")
    .select("*")
    .eq("room_id", room.id)
    .order("created_at");

  const { data } =
    round > 0 ? await baseQuery.eq("round_number", round) : await baseQuery;

  return NextResponse.json(data ?? [], {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { playerId, content } = (await req.json()) as {
    playerId: string;
    content: string;
  };

  if (!playerId || !content?.trim()) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }
  if (content.trim().length > 200) {
    return NextResponse.json({ error: "Réponse trop longue" }, { status: 400 });
  }

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
  if (room.status !== "playing") {
    return NextResponse.json({ error: "Partie non démarrée" }, { status: 409 });
  }
  if (room.current_drawer_player_id === playerId) {
    return NextResponse.json(
      { error: "Le dessinateur ne peut pas deviner" },
      { status: 400 }
    );
  }

  // Check already guessed correctly this round
  const { data: alreadyCorrect } = await admin
    .from("draw_guesses")
    .select("id")
    .eq("room_id", room.id)
    .eq("player_id", playerId)
    .eq("round_number", room.current_round)
    .eq("is_correct", true)
    .maybeSingle();

  if (alreadyCorrect) {
    return NextResponse.json({ ok: true, isCorrect: true, pointsEarned: 0 });
  }

  const currentWord = room.current_word as string | null;
  const isCorrect = currentWord
    ? normalizeGuess(content) === normalizeGuess(currentWord)
    : false;

  let pointsEarned = 0;
  if (isCorrect) {
    const { count: correctCount } = await admin
      .from("draw_guesses")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id)
      .eq("round_number", room.current_round)
      .eq("is_correct", true);

    const guessPosition = (correctCount ?? 0) + 1;
    const roundDuration = room.round_duration_seconds as number;
    const elapsed = room.round_started_at
      ? (Date.now() - new Date(room.round_started_at as string).getTime()) / 1000
      : roundDuration;
    const timeRemaining = Math.max(0, roundDuration - elapsed);
    pointsEarned = computeGuesserPoints(timeRemaining, roundDuration, guessPosition);
  }

  const { error } = await admin.from("draw_guesses").insert({
    room_id: room.id,
    player_id: playerId,
    round_number: room.current_round,
    content: content.trim(),
    is_correct: isCorrect,
    points_earned: pointsEarned,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (isCorrect && pointsEarned > 0) {
    const { data: player } = await admin
      .from("draw_players")
      .select("score")
      .eq("id", playerId)
      .single();
    if (player) {
      await admin
        .from("draw_players")
        .update({ score: (player.score as number) + pointsEarned })
        .eq("id", playerId);
    }
  }

  return NextResponse.json({ ok: true, isCorrect, pointsEarned });
}
