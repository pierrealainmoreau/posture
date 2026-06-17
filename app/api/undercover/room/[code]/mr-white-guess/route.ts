import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";
import { checkWinConditions } from "@/lib/undercover/game-logic";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const { playerId, guess } = (await req.json()) as { playerId: string; guess: string };

  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "undercover_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { data: room } = await admin
    .from("undercover_rooms")
    .select("id, status, eliminated_player_id, civil_word")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (room.status !== "mr_white_guess") return NextResponse.json({ error: "Mauvaise phase" }, { status: 409 });
  if (room.eliminated_player_id !== playerId) {
    return NextResponse.json({ error: "Ce n\'est pas votre tour de deviner" }, { status: 403 });
  }

  const trimmedGuess = (guess ?? "").trim();
  if (!trimmedGuess) return NextResponse.json({ error: "Mot requis" }, { status: 400 });

  const correct = normalize(trimmedGuess) === normalize(room.civil_word ?? "");

  await admin
    .from("undercover_rooms")
    .update({ mr_white_last_guess: trimmedGuess, mr_white_last_guess_correct: correct })
    .eq("id", room.id);

  if (correct) {
    const { data: player } = await admin
      .from("undercover_players")
      .select("total_score")
      .eq("id", playerId)
      .single();

    if (player) {
      await admin
        .from("undercover_players")
        .update({ total_score: (player.total_score ?? 0) + 6 })
        .eq("id", playerId);
    }

    await admin
      .from("undercover_rooms")
      .update({ status: "finished", winner: "mr_white" })
      .eq("id", room.id);
  } else {
    await checkWinConditions(admin, room.id);
  }

  return NextResponse.json({ correct }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
  });
}
