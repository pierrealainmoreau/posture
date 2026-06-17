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
  const playerSecret = req.headers.get("X-Player-Secret") ?? "";
  const { playerId } = (await req.json()) as { playerId: string };

  if (!playerId) {
    return NextResponse.json({ error: "playerId manquant" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: room, error: roomErr } = await admin
    .from("roti_rooms")
    .select("id, status, host_player_id")
    .eq("code", code)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  if (room.status !== "voting") {
    return NextResponse.json({ error: "La session n'est pas en cours de vote" }, { status: 409 });
  }

  if (room.host_player_id !== playerId) {
    return NextResponse.json({ error: "Seul l'hôte peut révéler les résultats" }, { status: 403 });
  }

  const valid = await verifyPlayerSecret(admin, "roti_players", playerId, playerSecret);
  if (!valid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  await admin.from("roti_rooms").update({ status: "finished" }).eq("id", room.id);

  return NextResponse.json({ ok: true });
}
