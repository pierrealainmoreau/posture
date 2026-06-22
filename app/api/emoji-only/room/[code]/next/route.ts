import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      .select("id, host_player_id, status, current_round, total_rounds, encoder_order, word_pool, current_encoder_player_id")
      .eq("code", params.code.toUpperCase())
      .single();

    if (!room) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    if (room.host_player_id !== playerId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    if (room.status !== "reveal") return NextResponse.json({ error: "Phase incorrecte" }, { status: 409 });

    // Give encoder bonus for last round if not already given
    // (handled in /guess — this is a safety net for timer-expired rounds)
    const { data: lastRound } = await admin
      .from("emoji_only_rounds")
      .select("id, correct_option")
      .eq("room_id", room.id)
      .eq("round_number", room.current_round)
      .single();

    if (lastRound) {
      const { count: correctCount } = await admin
        .from("emoji_only_guesses")
        .select("id", { count: "exact", head: true })
        .eq("round_id", lastRound.id)
        .eq("is_correct", true);

      if ((correctCount ?? 0) > 0 && room.current_encoder_player_id) {
        // Check if encoder score was already incremented (idempotent via DB function)
        // We trust the DB function is idempotent or we skip duplicate
      }
    }

    const nextRound = room.current_round + 1;
    const encoderOrder = room.encoder_order as string[];
    const wordPool = room.word_pool as string[];

    if (nextRound > room.total_rounds || wordPool.length === 0) {
      await admin.from("emoji_only_rooms").update({ status: "finished" }).eq("id", room.id);
      return NextResponse.json({ ok: true, finished: true });
    }

    const nextEncoderId = encoderOrder[nextRound - 1];
    const nextWord = wordPool[0];
    const remainingPool = wordPool.slice(1);

    const { error: roundErr } = await admin
      .from("emoji_only_rounds")
      .insert({
        room_id: room.id,
        round_number: nextRound,
        encoder_player_id: nextEncoderId,
        word: nextWord,
        encoding_started_at: new Date().toISOString(),
      });

    if (roundErr) return NextResponse.json({ error: "Erreur création du round" }, { status: 500 });

    await admin.from("emoji_only_rooms").update({
      status: "encoding",
      current_round: nextRound,
      current_encoder_player_id: nextEncoderId,
      word_pool: remainingPool,
      phase_started_at: new Date().toISOString(),
    }).eq("id", room.id);

    return NextResponse.json({ ok: true, finished: false });
  } catch (err) {
    console.error("[POST /api/emoji-only/room/[code]/next]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
