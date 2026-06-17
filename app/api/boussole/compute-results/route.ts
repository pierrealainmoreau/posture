import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { computePlayerResult } from "@/lib/boussole/scoring";
import { computeTeamMap } from "@/lib/boussole/team-map";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { code?: string; playerId?: string };
  const { code, playerId } = body;

  if (!code) {
    return NextResponse.json({ error: "code requis" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "boussole_players", playerId ?? "", playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { data: room, error: roomError } = await admin
    .from("boussole_rooms")
    .select("id, status")
    .eq("code", code.toUpperCase())
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room introuvable" }, { status: 404 });
  }

  if (room.status !== "playing") {
    return NextResponse.json({ error: "La partie n'est pas en cours" }, { status: 400 });
  }

  const { data: answers, error: answersError } = await admin
    .from("boussole_answers")
    .select("*")
    .eq("room_id", room.id);

  if (answersError) {
    return NextResponse.json({ error: answersError.message }, { status: 500 });
  }

  const { data: players, error: playersError } = await admin
    .from("boussole_players")
    .select("*")
    .eq("room_id", room.id);

  if (playersError) {
    return NextResponse.json({ error: playersError.message }, { status: 500 });
  }

  const allAnswers = answers ?? [];
  const allPlayers = players ?? [];

  const allResults = allPlayers.map((player) => {
    // Map DB snake_case fields to the SituationAnswer type expected by scoring lib
    const playerAnswers = allAnswers
      .filter((a) => a.player_id === player.id)
      .map((a) => ({
        situationId: a.situation_id as string,
        choiceValue: (a.answer_value ?? null) as import("@/lib/boussole/profiles").ProfilId | null,
      }));
    return computePlayerResult(player.id, playerAnswers);
  });

  const teamMap = computeTeamMap(allResults);

  // Store as native JSONB — do NOT JSON.stringify, or Postgres stores a
  // string literal inside jsonb instead of an array/object.
  const { error: insertError } = await admin
    .from("boussole_results")
    .insert({
      room_id: room.id,
      results: allResults,
      team_map: teamMap,
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from("boussole_rooms")
    .update({ status: "finished" })
    .eq("id", room.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ results: allResults, teamMap });
}
