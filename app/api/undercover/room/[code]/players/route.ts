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
  const body = (await req.json()) as { pseudo: string; avatarColor: string };
  const { pseudo, avatarColor } = body;

  if (!pseudo?.trim()) {
    return NextResponse.json({ error: "Pseudo requis" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: room } = await admin
    .from("undercover_rooms")
    .select("id, status")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });
  if (room.status !== "lobby") {
    return NextResponse.json({ error: "La partie a déjà commencé" }, { status: 409 });
  }

  const { data: existing } = await admin
    .from("undercover_players")
    .select("id")
    .eq("room_id", room.id)
    .limit(31);

  if ((existing ?? []).length >= 30) {
    return NextResponse.json({ error: "Partie pleine (30 joueurs max)" }, { status: 409 });
  }

  const playerSecret = generatePlayerSecret();

  const { data: player, error } = await admin
    .from("undercover_players")
    .insert({
      room_id: room.id,
      pseudo: pseudo.trim(),
      avatar_color: avatarColor ?? "#3b82f6",
      player_secret: playerSecret,
    })
    .select("id")
    .single();

  if (error || !player) {
    return NextResponse.json({ error: error?.message ?? "Erreur" }, { status: 500 });
  }

  return NextResponse.json({ playerId: player.id, playerSecret }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
  });
}
