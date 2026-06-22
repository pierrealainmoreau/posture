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
    const { pseudo, avatarColor, playerId } = await req.json() as {
      pseudo: string;
      avatarColor: string;
      playerId?: string;
    };

    if (!pseudo?.trim()) return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    if (pseudo.trim().length > 32) return NextResponse.json({ error: "Pseudo trop long" }, { status: 400 });

    const admin = createAdminSupabaseClient();
    const { data: room } = await admin
      .from("emoji_only_rooms")
      .select("id, status")
      .eq("code", params.code.toUpperCase())
      .single();

    if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    if (room.status !== "lobby") return NextResponse.json({ error: "La session a déjà commencé" }, { status: 409 });

    if (playerId) {
      const { data: existing } = await admin
        .from("emoji_only_players")
        .select("id, player_secret")
        .eq("id", playerId)
        .eq("room_id", room.id)
        .single();
      if (existing) return NextResponse.json({ ok: true, playerId: existing.id, playerSecret: existing.player_secret });
    }

    const playerSecret = generatePlayerSecret();
    const { data: player, error } = await admin
      .from("emoji_only_players")
      .insert({
        room_id: room.id,
        pseudo: pseudo.trim(),
        avatar_color: avatarColor ?? "#3b82f6",
        player_secret: playerSecret,
        score: 0,
      })
      .select("id")
      .single();

    if (error || !player) return NextResponse.json({ error: error?.message ?? "Erreur joueur" }, { status: 500 });

    return NextResponse.json({ ok: true, playerId: player.id, playerSecret }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", "Pragma": "no-cache" },
    });
  } catch (err) {
    console.error("[POST /api/emoji-only/room/[code]/players]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
