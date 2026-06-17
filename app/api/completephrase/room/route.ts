import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { generatePlayerSecret } from "@/lib/supabase/playerAuth";
import { markWeeklyCoachComplete } from "@/lib/weeklyCoach";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const { data: rooms } = await admin
      .from("completephrase_rooms")
      .select("id, code, status, starter_phrase, starter_phrases, created_at")
      .eq("creator_user_id", user.id)
      .order("created_at", { ascending: false });

    if (!rooms) return NextResponse.json([]);

    const roomIds = rooms.map((r) => r.id);
    const { data: players } = await admin
      .from("completephrase_players")
      .select("room_id")
      .in("room_id", roomIds);

    const result = rooms.map((r) => ({
      ...r,
      // Afficher la première phrase (ou la starter_phrase legacy)
      starter_phrase: (r.starter_phrases as string[] | null)?.[0] ?? r.starter_phrase,
      player_count: (players ?? []).filter((p) => p.room_id === r.id).length,
    }));

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
      },
    });
  } catch (err) {
    console.error("[GET /api/completephrase/room]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      pseudo: string;
      avatarColor: string;
      starterPhrase?: string;
      starterPhrases?: string[];
    };

    const { pseudo, avatarColor } = body;

    // Accepte soit starterPhrases[] (nouveau), soit starterPhrase (legacy)
    const phrases: string[] = body.starterPhrases?.length
      ? body.starterPhrases.filter((p) => p.trim())
      : body.starterPhrase?.trim()
        ? [body.starterPhrase.trim()]
        : [];

    if (!pseudo?.trim() || phrases.length === 0) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Connexion requise pour créer une session" }, { status: 401 });

    const admin = createAdminSupabaseClient();

    for (let i = 0; i < 5; i++) {
      const code = generateCode();

      const { data: room, error: roomErr } = await admin
        .from("completephrase_rooms")
        .insert({
          code,
          creator_user_id: user.id,
          starter_phrase: phrases[0],       // rétro-compat
          starter_phrases: phrases,
          current_phrase_index: 0,
        })
        .select("id, code")
        .single();

      if (roomErr) {
        if (roomErr.message.includes("unique")) continue;
        return NextResponse.json({ error: roomErr.message }, { status: 500 });
      }

      const playerSecret = generatePlayerSecret();

      const { data: player, error: playerErr } = await admin
        .from("completephrase_players")
        .insert({
          room_id: room.id,
          pseudo: pseudo.trim(),
          avatar_color: avatarColor ?? "#3b82f6",
          is_host: true,
          player_secret: playerSecret,
          responses: [],
        })
        .select("id")
        .single();

      if (playerErr || !player) {
        await admin.from("completephrase_rooms").delete().eq("id", room.id);
        return NextResponse.json({ error: playerErr?.message ?? "Erreur joueur" }, { status: 500 });
      }

      await admin.from("completephrase_rooms").update({ host_player_id: player.id }).eq("id", room.id);
      await admin.from("usage").insert({ user_id: user.id, tool: "completephrase" });
      await markWeeklyCoachComplete(user.id, "completephrase");

      return NextResponse.json({ code: room.code, playerId: player.id, playerSecret });
    }

    return NextResponse.json({ error: "Impossible de créer la session" }, { status: 500 });
  } catch (err) {
    console.error("[POST /api/completephrase/room]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
