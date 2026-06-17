import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { generatePlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { playerId, pseudo, avatarColor } = (await req.json()) as {
    playerId?: string;
    pseudo: string;
    avatarColor: string;
  };

  if (!pseudo?.trim()) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }
  if (pseudo.trim().length > 32) {
    return NextResponse.json({ error: "Pseudo trop long" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: room } = await admin
    .from("chaine_rooms")
    .select("id, status")
    .eq("code", params.code.toUpperCase())
    .single();

  if (!room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }
  if (room.status !== "lobby") {
    return NextResponse.json({ error: "La partie a déjà commencé" }, { status: 409 });
  }

  // Reconnect: if the client sends a known server-generated id, return it directly
  if (playerId) {
    const { data: existing } = await admin
      .from("chaine_players")
      .select("id, player_secret")
      .eq("id", playerId)
      .eq("room_id", room.id)
      .single();
    if (existing) return NextResponse.json({ ok: true, playerId: existing.id, playerSecret: existing.player_secret });
  }

  const playerSecret = generatePlayerSecret();

  const { data: player, error } = await admin
    .from("chaine_players")
    .insert({
      room_id: room.id,
      pseudo: pseudo.trim(),
      avatar_color: avatarColor ?? "#8b5cf6",
      player_secret: playerSecret,
    })
    .select("id")
    .single();

  if (error || !player) {
    return NextResponse.json({ error: error?.message ?? "Erreur joueur" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, playerId: player.id, playerSecret });
}
