import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { generatePlayerSecret } from "@/lib/supabase/playerAuth";
import { markWeeklyCoachComplete } from "@/lib/weeklyCoach";
import { WORD_BANK } from "@/lib/emoji-only/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const { data: rooms } = await admin
      .from("emoji_only_rooms")
      .select("id, code, status, category, created_at")
      .eq("creator_user_id", user.id)
      .order("created_at", { ascending: false });

    if (!rooms) return NextResponse.json([]);

    const roomIds = rooms.map((r) => r.id);
    const { data: players } = await admin
      .from("emoji_only_players")
      .select("room_id")
      .in("room_id", roomIds);

    const result = rooms.map((r) => ({
      ...r,
      player_count: (players ?? []).filter((p) => p.room_id === r.id).length,
    }));

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", "Pragma": "no-cache" },
    });
  } catch (err) {
    console.error("[GET /api/emoji-only/room]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      pseudo: string;
      avatarColor: string;
      category: "films" | "valeurs" | "animaux" | "custom";
      customWords?: string[];
    };

    const { pseudo, avatarColor, category } = body;
    const customWords: string[] = (body.customWords ?? []).filter((w) => w.trim());

    if (!pseudo?.trim()) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const bankWords = category !== "custom" ? WORD_BANK[category] ?? [] : [];
    const allWords = [...bankWords, ...customWords];

    if (allWords.length < 4) {
      return NextResponse.json(
        { error: "Ajoutez au moins 4 mots pour démarrer une partie." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Connexion requise pour créer une session" }, { status: 401 });

    const admin = createAdminSupabaseClient();

    for (let i = 0; i < 5; i++) {
      const code = generateCode();

      const { data: room, error: roomErr } = await admin
        .from("emoji_only_rooms")
        .insert({
          code,
          creator_user_id: user.id,
          category,
          custom_words: customWords,
          word_pool: shuffle(allWords),
          current_round: 0,
          total_rounds: 0,
          encoder_order: [],
        })
        .select("id, code")
        .single();

      if (roomErr) {
        if (roomErr.message.includes("unique")) continue;
        return NextResponse.json({ error: roomErr.message }, { status: 500 });
      }

      const playerSecret = generatePlayerSecret();

      const { data: player, error: playerErr } = await admin
        .from("emoji_only_players")
        .insert({
          room_id: room.id,
          pseudo: pseudo.trim(),
          avatar_color: avatarColor ?? "#3b82f6",
          is_host: true,
          player_secret: playerSecret,
          score: 0,
        })
        .select("id")
        .single();

      if (playerErr || !player) {
        await admin.from("emoji_only_rooms").delete().eq("id", room.id);
        return NextResponse.json({ error: playerErr?.message ?? "Erreur joueur" }, { status: 500 });
      }

      await admin.from("emoji_only_rooms").update({ host_player_id: player.id }).eq("id", room.id);
      await admin.from("usage").insert({ user_id: user.id, tool: "emojionly" });
      await markWeeklyCoachComplete(user.id, "emojionly");

      return NextResponse.json({ code: room.code, playerId: player.id, playerSecret });
    }

    return NextResponse.json({ error: "Impossible de créer la session" }, { status: 500 });
  } catch (err) {
    console.error("[POST /api/emoji-only/room]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
