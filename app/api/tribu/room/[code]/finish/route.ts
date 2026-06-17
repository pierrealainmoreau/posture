import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

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
  const { data: room } = await admin
    .from("tribu_rooms")
    .select("id")
    .eq("code", params.code.toUpperCase())
    .single();
  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  const { error } = await admin
    .from("tribu_players")
    .update({ finished_at: new Date().toISOString() })
    .eq("id", playerId)
    .eq("room_id", room.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
