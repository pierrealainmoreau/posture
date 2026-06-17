import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { pickSituations } from "@/lib/boussole/situations";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  const body = await req.json().catch(() => ({})) as { playerId?: string };
  const { playerId } = body;

  if (!playerId) {
    return NextResponse.json({ error: "playerId requis" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "boussole_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { data: room, error: roomError } = await admin
    .from("boussole_rooms")
    .select("id, host_player_id, status, situation_count")
    .eq("code", code)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room introuvable" }, { status: 404 });
  }

  if (room.host_player_id !== playerId) {
    return NextResponse.json({ error: "Réservé à l'hôte" }, { status: 403 });
  }

  if (room.status !== "lobby") {
    return NextResponse.json({ error: "La partie a déjà commencé" }, { status: 400 });
  }

  const { count, error: countError } = await admin
    .from("boussole_players")
    .select("id", { count: "exact", head: true })
    .eq("room_id", room.id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) < 2) {
    return NextResponse.json({ error: "Au moins 2 joueurs requis" }, { status: 400 });
  }

  const situationIds = pickSituations(room.situation_count);

  const { error: updateError } = await admin
    .from("boussole_rooms")
    .update({ status: "playing", situation_ids: situationIds })
    .eq("id", room.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
