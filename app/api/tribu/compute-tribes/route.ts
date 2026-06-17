import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { clusterPlayers } from "@/lib/tribu/clustering";
import { assignTribes } from "@/lib/tribu/naming";
import type { PlayerAnswers } from "@/lib/tribu/clustering";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export async function POST(req: NextRequest) {
  const { roomId, playerId } = (await req.json()) as {
    roomId: string;
    playerId: string;
  };

  if (!roomId || !playerId) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "tribu_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  // Validate host
  const { data: room } = await admin
    .from("tribu_rooms")
    .select("id, host_player_id, status")
    .eq("id", roomId)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (room.host_player_id !== playerId)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (room.status === "revealing" || room.status === "finished") {
    // Already computed — return existing result
    const { data: existing } = await admin
      .from("tribu_results")
      .select("tribes")
      .eq("room_id", roomId)
      .single();
    if (existing) return NextResponse.json({ tribes: existing.tribes });
  }

  // Fetch all answers
  const { data: rawAnswers } = await admin
    .from("tribu_answers")
    .select("player_id, question_id, answer_value")
    .eq("room_id", roomId);

  // Build PlayerAnswers structure
  const playerMap: Record<string, Record<string, string>> = {};
  for (const row of rawAnswers ?? []) {
    if (!playerMap[row.player_id]) playerMap[row.player_id] = {};
    playerMap[row.player_id][row.question_id] = row.answer_value;
  }

  const playerAnswers: PlayerAnswers[] = Object.entries(playerMap).map(
    ([pid, answers]) => ({ playerId: pid, answers })
  );

  // Run clustering
  const clusters = clusterPlayers(playerAnswers);

  // Assign tribe names
  const tribes = assignTribes(clusters, playerAnswers);

  // Persist result
  const { error: insertErr } = await admin
    .from("tribu_results")
    .upsert({ room_id: roomId, tribes }, { onConflict: "room_id" });

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Update room status to finished (tribes formed = session terminée)
  await admin
    .from("tribu_rooms")
    .update({ status: "finished" })
    .eq("id", roomId);

  return NextResponse.json({ tribes });
}
