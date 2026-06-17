import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { generatePlayerSecret } from "@/lib/supabase/playerAuth";

const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    pseudo?: string;
    avatarColor?: string;
    situationCount?: number;
  };

  const pseudo = (body.pseudo ?? "").trim();
  if (!pseudo || pseudo.length > 32) {
    return NextResponse.json({ error: "pseudo invalide" }, { status: 400 });
  }

  const avatarColor = body.avatarColor ?? "";
  if (!avatarColor) {
    return NextResponse.json({ error: "avatarColor requis" }, { status: 400 });
  }

  const validCounts = [8, 12, 16];
  const situationCount = body.situationCount ?? 12;
  if (!validCounts.includes(situationCount)) {
    return NextResponse.json({ error: "situationCount doit être 8, 12 ou 16" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise pour créer une session" }, { status: 401 });
  const creatorUserId = user.id;

  let room: { id: string; code: string } | null = null;
  for (let i = 0; i < 5; i++) {
    const code = generateCode();
    const { data, error } = await admin
      .from("boussole_rooms")
      .insert({ code, situation_count: situationCount })
      .select("id, code")
      .single();

    if (!error && data) {
      room = data;
      break;
    }
    if (error && !error.message.includes("unique")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (!room) {
    return NextResponse.json({ error: "Impossible de créer la room" }, { status: 500 });
  }

  const playerSecret = generatePlayerSecret();

  const { data: player, error: playerError } = await admin
    .from("boussole_players")
    .insert({ room_id: room.id, pseudo, avatar_color: avatarColor, is_host: true, player_secret: playerSecret })
    .select("id")
    .single();

  if (playerError || !player) {
    return NextResponse.json({ error: playerError?.message ?? "Erreur création joueur" }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from("boussole_rooms")
    .update({ host_player_id: player.id })
    .eq("id", room.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (creatorUserId) await admin.from("usage").insert({ user_id: creatorUserId, tool: "boussole" });
  return NextResponse.json({ code: room.code, playerId: player.id, playerSecret });
}
