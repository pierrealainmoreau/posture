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
  const { playerId, vote } = (await req.json()) as { playerId: string; vote: number };

  if (!playerId) {
    return NextResponse.json({ error: "playerId manquant" }, { status: 400 });
  }

  if (!Number.isInteger(vote) || vote < 1 || vote > 5) {
    return NextResponse.json({ error: "Vote invalide (1-5)" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: room, error: roomErr } = await admin
    .from("roti_rooms")
    .select("id, status")
    .eq("code", code)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  if (room.status !== "voting") {
    return NextResponse.json({ error: "Le vote n'est pas ouvert" }, { status: 409 });
  }

  const valid = await verifyPlayerSecret(admin, "roti_players", playerId, playerSecret);
  if (!valid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { error: updateErr } = await admin
    .from("roti_players")
    .update({ vote })
    .eq("id", playerId)
    .eq("room_id", room.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
