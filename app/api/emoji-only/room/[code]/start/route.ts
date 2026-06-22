import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

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

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId } = await req.json() as { playerId: string };
    const admin = createAdminSupabaseClient();
    const playerSecret = req.headers.get("X-Player-Secret");
    const isValid = await verifyPlayerSecret(admin, "emoji_only_players", playerId, playerSecret);
    if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const { data: room } = await admin
      .from("emoji_only_rooms")
      .select("id, host_player_id, status, word_pool")
      .eq("code", params.code.toUpperCase())
      .single();

    if (!room) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    if (room.host_player_id !== playerId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    if (room.status !== "lobby") return NextResponse.json({ error: "Déjà démarrée" }, { status: 409 });

    const { data: players } = await admin
      .from("emoji_only_players")
      .select("id")
      .eq("room_id", room.id);

    if (!players || players.length < 2) {
      return NextResponse.json({ error: "Il faut au moins 2 participants" }, { status: 400 });
    }

    const encoderOrder = shuffle(players.map((p) => p.id));
    const totalRounds = encoderOrder.length;
    const firstEncoderId = encoderOrder[0];
    const wordPool = room.word_pool as string[];
    const word = wordPool[0];
    const remainingPool = wordPool.slice(1);

    // Create first round
    const { data: round, error: roundErr } = await admin
      .from("emoji_only_rounds")
      .insert({
        room_id: room.id,
        round_number: 1,
        encoder_player_id: firstEncoderId,
        word,
        encoding_started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (roundErr || !round) {
      return NextResponse.json({ error: "Erreur création du round" }, { status: 500 });
    }

    await admin.from("emoji_only_rooms").update({
      status: "encoding",
      current_round: 1,
      total_rounds: totalRounds,
      current_encoder_player_id: firstEncoderId,
      encoder_order: encoderOrder,
      word_pool: remainingPool,
      phase_started_at: new Date().toISOString(),
    }).eq("id", room.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/emoji-only/room/[code]/start]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
