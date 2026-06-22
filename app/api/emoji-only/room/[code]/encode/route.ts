import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";
import { getAnthropicClient, MODEL_ID } from "@/lib/anthropic";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";
import { WORD_BANK } from "@/lib/emoji-only/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function generateDistractors(word: string, emoji: string, category: string): Promise<string[]> {
  try {
    const client = getAnthropicClient();
    const msg = await client.messages.create({
      model: MODEL_ID,
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `The word is "${word}". The encoder used these emojis: "${emoji}". Generate exactly 3 plausible but incorrect answer options in French that a player might guess from these emojis. Return ONLY a JSON array of 3 strings, nothing else. Example: ["Option A", "Option B", "Option C"]`,
      }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    const parsed = JSON.parse(text) as string[];
    if (Array.isArray(parsed) && parsed.length === 3) return parsed;
    throw new Error("Invalid response");
  } catch {
    // Fallback: pick 3 random words from same category bank
    const pool = WORD_BANK[category] ?? Object.values(WORD_BANK).flat();
    const candidates = pool.filter((w) => w !== word);
    return shuffle(candidates).slice(0, 3);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, emojiSequence } = await req.json() as {
      playerId: string;
      emojiSequence: string;
    };

    const admin = createAdminSupabaseClient();
    const playerSecret = req.headers.get("X-Player-Secret");
    const isValid = await verifyPlayerSecret(admin, "emoji_only_players", playerId, playerSecret);
    if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    if (emojiSequence && emojiSequence.length > 200) {
      return NextResponse.json({ error: "Séquence d'emojis trop longue" }, { status: 400 });
    }

    const { data: room } = await admin
      .from("emoji_only_rooms")
      .select("id, status, current_round, current_encoder_player_id, category, creator_user_id")
      .eq("code", params.code.toUpperCase())
      .single();

    if (!room) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    if (room.status !== "encoding") return NextResponse.json({ error: "Phase incorrecte" }, { status: 409 });
    if (room.current_encoder_player_id !== playerId) {
      return NextResponse.json({ error: "Ce n'est pas votre tour d'encoder" }, { status: 403 });
    }

    const { data: round } = await admin
      .from("emoji_only_rounds")
      .select("id, word")
      .eq("room_id", room.id)
      .eq("round_number", room.current_round)
      .single();

    if (!round) return NextResponse.json({ error: "Round introuvable" }, { status: 404 });

    if (room.creator_user_id) {
      const { allowed, count, limit } = await checkRateLimit(room.creator_user_id, admin);
      if (!allowed) {
        return NextResponse.json(
          { error: "Limite de requêtes atteinte", details: `Vous avez utilisé ${count}/${limit} requêtes disponibles.` },
          { status: 429 },
        );
      }
    }

    // Mark as generating
    await admin.from("emoji_only_rooms").update({ status: "generating" }).eq("id", room.id);

    const distractors = await generateDistractors(round.word, emojiSequence, room.category);
    const options = shuffle([round.word, ...distractors]);

    await admin.from("emoji_only_rounds").update({
      emoji_sequence: emojiSequence || "❓",
      options,
      correct_option: round.word,
      guessing_started_at: new Date().toISOString(),
    }).eq("id", round.id);

    await admin.from("emoji_only_rooms").update({
      status: "guessing",
      phase_started_at: new Date().toISOString(),
    }).eq("id", room.id);

    if (room.creator_user_id) {
      await recordUsage(room.creator_user_id, "emoji_only", admin);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/emoji-only/room/[code]/encode]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
