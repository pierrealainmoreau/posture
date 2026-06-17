import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TURN_SECONDS = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { turnIndex } = (await req.json()) as { turnIndex: number };

  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();

  const { data: room } = await admin
    .from("chaine_rooms")
    .select("id, status, current_turn_index, player_order, turn_started_at")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  if (room.status !== "playing") return NextResponse.json({ ok: true, skipped: true });

  // Idempotence: only act on the expected turn
  if (room.current_turn_index !== turnIndex) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Verify timer has truly elapsed server-side
  if (!room.turn_started_at) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  const elapsed = (Date.now() - new Date(room.turn_started_at).getTime()) / 1000;
  if (elapsed < TURN_SECONDS) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const now = new Date().toISOString();
  const nextTurnIndex = turnIndex + 1;
  const isLastTurn = nextTurnIndex > room.player_order.length;

  // Insert a null word for the skipped turn (ignore conflict — idempotent)
  await admin.from("chaine_words").upsert(
    { room_id: room.id, player_id: null, turn_index: turnIndex, word: null },
    { onConflict: "room_id,turn_index", ignoreDuplicates: true }
  );

  await admin
    .from("chaine_rooms")
    .update({
      current_turn_index: nextTurnIndex,
      turn_started_at: isLastTurn ? null : now,
      status: isLastTurn ? "voting" : "playing",
    })
    .eq("id", room.id)
    .eq("current_turn_index", turnIndex); // extra guard against race

  return NextResponse.json({ ok: true, finished: isLastTurn });
}
