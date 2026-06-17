import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
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
    .select("id")
    .eq("code", code)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room introuvable" }, { status: 404 });
  }

  const { error: updateError } = await admin
    .from("boussole_players")
    .update({ finished_at: new Date().toISOString() })
    .eq("id", playerId)
    .eq("room_id", room.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
