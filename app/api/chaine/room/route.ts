import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { pickRandomStarterWord } from "@/lib/chaine/starter-words";
import { generatePlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: rooms } = await admin
    .from("chaine_rooms")
    .select("id, code, status, starter_word, created_at")
    .eq("creator_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!rooms) return NextResponse.json([]);

  const roomIds = rooms.map((r) => r.id);
  const { data: players } = await admin
    .from("chaine_players")
    .select("room_id")
    .in("room_id", roomIds);

  const result = rooms.map((r) => ({
    ...r,
    player_count: (players ?? []).filter((p) => p.room_id === r.id).length,
  }));

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    pseudo: string;
    avatarColor: string;
    starterWord?: string;
  };

  const { pseudo, avatarColor, starterWord } = body;

  if (!pseudo?.trim()) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const word = starterWord?.trim() || pickRandomStarterWord();
  const admin = createAdminSupabaseClient();

  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise pour créer une session" }, { status: 401 });
  const creatorUserId = user.id;

  for (let i = 0; i < 5; i++) {
    const code = generateCode();

    // Insert room with a placeholder host_player_id (updated after player insert)
    const { data: room, error: roomErr } = await admin
      .from("chaine_rooms")
      .insert({
        code,
        host_player_id: "00000000-0000-0000-0000-000000000000",
        starter_word: word,
        ...(creatorUserId ? { creator_user_id: creatorUserId } : {}),
      })
      .select("id, code")
      .single();

    if (roomErr) {
      if (roomErr.message.includes("unique")) continue;
      return NextResponse.json({ error: roomErr.message }, { status: 500 });
    }

    const playerSecret = generatePlayerSecret();

    const { data: player, error: playerErr } = await admin
      .from("chaine_players")
      .insert({
        room_id: room.id,
        pseudo: pseudo.trim(),
        avatar_color: avatarColor ?? "#8b5cf6",
        is_host: true,
        player_secret: playerSecret,
      })
      .select("id")
      .single();

    if (playerErr || !player) {
      await admin.from("chaine_rooms").delete().eq("id", room.id);
      return NextResponse.json({ error: playerErr?.message ?? "Erreur joueur" }, { status: 500 });
    }

    await admin
      .from("chaine_rooms")
      .update({ host_player_id: player.id })
      .eq("id", room.id);

    if (creatorUserId) await admin.from("usage").insert({ user_id: creatorUserId, tool: "chaine" });
    return NextResponse.json({ code: room.code, playerId: player.id, playerSecret });
  }

  return NextResponse.json({ error: "Impossible de créer la partie" }, { status: 500 });
}
