import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { playerId } = (await req.json()) as { playerId: string };
  if (!playerId) return NextResponse.json({ error: "Champs manquants" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "tribu_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const code = params.code.toUpperCase();

  const { data: room } = await admin
    .from("tribu_rooms")
    .select("id, host_player_id, status")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (room.host_player_id !== playerId)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (room.status !== "finished" && room.status !== "revealing")
    return NextResponse.json({ error: "La partie n'est pas terminée" }, { status: 409 });

  // Reset players finished_at
  await admin
    .from("tribu_players")
    .update({ finished_at: null })
    .eq("room_id", room.id);

  // Delete answers
  await admin
    .from("tribu_answers")
    .delete()
    .eq("room_id", room.id);

  // Delete results
  await admin
    .from("tribu_results")
    .delete()
    .eq("room_id", room.id);

  // Reset room to lobby (new questions will be picked at start)
  const { error } = await admin
    .from("tribu_rooms")
    .update({ status: "lobby", question_ids: [] })
    .eq("id", room.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
