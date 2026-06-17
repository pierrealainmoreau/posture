import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { generatePlayerSecret } from "@/lib/supabase/playerAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  const body = await req.json().catch(() => ({})) as {
    pseudo?: string;
    avatarColor?: string;
  };

  const pseudo = (body.pseudo ?? "").trim();
  if (!pseudo || pseudo.length > 32) {
    return NextResponse.json({ error: "pseudo invalide" }, { status: 400 });
  }

  const avatarColor = body.avatarColor ?? "";
  if (!avatarColor) {
    return NextResponse.json({ error: "avatarColor requis" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: room, error: roomError } = await admin
    .from("boussole_rooms")
    .select("id, status")
    .eq("code", code)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room introuvable" }, { status: 404 });
  }

  if (room.status !== "lobby") {
    return NextResponse.json({ error: "La partie a déjà commencé" }, { status: 400 });
  }

  const playerSecret = generatePlayerSecret();

  const { data: player, error: playerError } = await admin
    .from("boussole_players")
    .insert({ room_id: room.id, pseudo, avatar_color: avatarColor, is_host: false, player_secret: playerSecret })
    .select("id")
    .single();

  if (playerError || !player) {
    return NextResponse.json({ error: playerError?.message ?? "Erreur création joueur" }, { status: 500 });
  }

  return NextResponse.json({ playerId: player.id, playerSecret });
}
