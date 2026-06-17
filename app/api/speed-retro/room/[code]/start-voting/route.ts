import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const playerSecret = req.headers.get("X-Player-Secret");
  const { playerId } = (await req.json()) as { playerId: string };

  if (!playerId) {
    return NextResponse.json({ error: "playerId manquant" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const valid = await verifyPlayerSecret(admin, "speed_retro_players", playerId, playerSecret);
  if (!valid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { data: room, error: roomErr } = await admin
    .from("speed_retro_rooms")
    .select("id, status, host_player_id")
    .eq("code", code)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  if (room.host_player_id !== playerId) {
    return NextResponse.json({ error: "Réservé à l'animateur" }, { status: 403 });
  }

  if (room.status !== "writing") {
    return NextResponse.json({ error: "La phase d'écriture n'est pas active" }, { status: 409 });
  }

  const { error: updateErr } = await admin
    .from("speed_retro_rooms")
    .update({ status: "voting", voting_started_at: new Date().toISOString() })
    .eq("id", room.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
