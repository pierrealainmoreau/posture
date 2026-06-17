import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
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
    .from("roti_rooms")
    .select("id, code, status, session_name, created_at")
    .eq("creator_user_id", user.id)
    .order("created_at", { ascending: false });

  if (!rooms) return NextResponse.json([]);

  const roomIds = rooms.map((r) => r.id);
  const { data: players } = await admin
    .from("roti_players")
    .select("room_id")
    .in("room_id", roomIds);

  const result = rooms.map((r) => ({
    ...r,
    player_count: (players ?? []).filter((p) => p.room_id === r.id).length,
  }));

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    },
  });
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise pour créer une session" }, { status: 401 });

  const body = (await req.json()) as {
    pseudo: string;
    avatarColor: string;
    sessionName?: string;
  };

  const { pseudo, avatarColor, sessionName } = body;

  if (!pseudo?.trim()) return NextResponse.json({ error: "Pseudo manquant" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  for (let i = 0; i < 5; i++) {
    const code = generateCode();

    const { data: room, error: roomErr } = await admin
      .from("roti_rooms")
      .insert({
        code,
        creator_user_id: user.id,
        session_name: sessionName?.trim() || null,
      })
      .select("id, code")
      .single();

    if (roomErr) {
      if (roomErr.message.includes("unique")) continue;
      return NextResponse.json({ error: roomErr.message }, { status: 500 });
    }

    const playerSecret = generatePlayerSecret();

    const { data: player, error: playerErr } = await admin
      .from("roti_players")
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
      await admin.from("roti_rooms").delete().eq("id", room.id);
      return NextResponse.json({ error: playerErr?.message ?? "Erreur joueur" }, { status: 500 });
    }

    await admin.from("roti_rooms").update({ host_player_id: player.id }).eq("id", room.id);

    return NextResponse.json({ code: room.code, playerId: player.id, playerSecret });
  }

  return NextResponse.json({ error: "Impossible de créer la session" }, { status: 500 });
}
