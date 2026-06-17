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
  const isValid = await verifyPlayerSecret(admin, "humeur_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const { data: room } = await admin
    .from("humeur_rooms")
    .select("id, host_player_id, status")
    .eq("code", params.code.toUpperCase())
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (room.host_player_id !== playerId)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (room.status !== "playing")
    return NextResponse.json({ error: "Partie non en cours" }, { status: 409 });

  const { error } = await admin
    .from("humeur_rooms")
    .update({ status: "finished" })
    .eq("id", room.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
