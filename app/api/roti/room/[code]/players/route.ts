import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { generatePlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const { pseudo, avatarColor } = (await req.json()) as { pseudo: string; avatarColor: string };

  if (!pseudo?.trim()) {
    return NextResponse.json({ error: "Pseudo manquant" }, { status: 400 });
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

  if (room.status !== "lobby") {
    return NextResponse.json({ error: "La session a déjà commencé" }, { status: 409 });
  }

  const playerSecret = generatePlayerSecret();

  const { data: player, error: playerErr } = await admin
    .from("roti_players")
    .insert({
      room_id: room.id,
      pseudo: pseudo.trim(),
      avatar_color: avatarColor ?? "#3b82f6",
      is_host: false,
      player_secret: playerSecret,
    })
    .select("id")
    .single();

  if (playerErr || !player) {
    return NextResponse.json({ error: playerErr?.message ?? "Erreur joueur" }, { status: 500 });
  }

  return NextResponse.json({ playerId: player.id, playerSecret });
}
