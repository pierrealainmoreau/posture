import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { generatePlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase();
    const body = (await req.json()) as { pseudo: string; avatarColor: string; team?: string };
    const { pseudo, avatarColor, team } = body;

    if (!pseudo?.trim()) return NextResponse.json({ error: "Pseudo requis" }, { status: 400 });

    const admin = createAdminSupabaseClient();
    const { data: room } = await admin
      .from("code_secret_rooms")
      .select("id, status, game_mode")
      .eq("code", code)
      .single();

    if (!room) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });
    if (room.status !== "lobby") return NextResponse.json({ error: "La partie a déjà commencé" }, { status: 409 });

    const playerSecret = generatePlayerSecret();
    const { data: player, error } = await admin
      .from("code_secret_players")
      .insert({
        room_id: room.id,
        pseudo: pseudo.trim(),
        avatar_color: avatarColor ?? "#3b82f6",
        is_host: false,
        team: room.game_mode === "competitive" ? (team ?? null) : null,
        player_secret: playerSecret,
      })
      .select("id")
      .single();

    if (error || !player) return NextResponse.json({ error: error?.message ?? "Erreur" }, { status: 500 });

    return NextResponse.json({ ok: true, playerId: player.id, playerSecret });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
