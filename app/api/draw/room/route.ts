import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { generatePlayerSecret } from "@/lib/supabase/playerAuth";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: rooms } = await admin
    .from("draw_rooms")
    .select("id, code, status, rounds_total, current_round, created_at")
    .eq("creator_user_id", user.id)
    .order("created_at", { ascending: false });

  if (!rooms) return NextResponse.json([]);

  const roomIds = rooms.map((r) => r.id);
  const { data: players } = await admin
    .from("draw_players")
    .select("room_id")
    .in("room_id", roomIds);

  const result = rooms.map((r) => ({
    ...r,
    player_count: (players ?? []).filter((p) => p.room_id === r.id).length,
  }));

  return NextResponse.json(result);
}

function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    pseudo: string;
    avatarColor: string;
    roundsTotal?: number;
    roundDuration?: number;
    wordTheme?: string;
  };

  const {
    pseudo,
    avatarColor,
    roundsTotal = 3,
    roundDuration = 80,
    wordTheme = "all",
  } = body;

  if (!pseudo?.trim()) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }
  if (roundDuration !== undefined && (typeof roundDuration !== 'number' || roundDuration < 10 || roundDuration > 300)) {
    return NextResponse.json({ error: "roundDuration invalide" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise pour créer une session" }, { status: 401 });
  const creatorUserId = user.id;

  for (let i = 0; i < 5; i++) {
    const code = generateCode();

    const { data: room, error: roomErr } = await admin
      .from("draw_rooms")
      .insert({
        code,
        rounds_total: roundsTotal,
        round_duration_seconds: roundDuration,
        word_theme: wordTheme,
        ...(creatorUserId ? { creator_user_id: creatorUserId } : {}),
      })
      .select("id, code")
      .single();

    if (roomErr) {
      if (roomErr.message.includes("unique")) continue;
      return NextResponse.json({ error: roomErr.message }, { status: 500 });
    }

    const playerSecret = generatePlayerSecret();

    // Let Supabase generate the UUID — read back the actual id
    const { data: player, error: playerErr } = await admin
      .from("draw_players")
      .insert({
        room_id: room.id,
        pseudo: pseudo.trim(),
        avatar_color: avatarColor ?? "#3b82f6",
        is_host: true,
        player_secret: playerSecret,
      })
      .select("id")
      .single();

    if (playerErr || !player) {
      await admin.from("draw_rooms").delete().eq("id", room.id);
      return NextResponse.json({ error: playerErr?.message ?? "Erreur joueur" }, { status: 500 });
    }

    // host_player_id = actual DB-generated player id
    await admin
      .from("draw_rooms")
      .update({ host_player_id: player.id })
      .eq("id", room.id);

    if (creatorUserId) await admin.from("usage").insert({ user_id: creatorUserId, tool: "draw" });
    return NextResponse.json({ code: room.code, playerId: player.id, playerSecret });
  }

  return NextResponse.json(
    { error: "Impossible de créer la partie" },
    { status: 500 }
  );
}
