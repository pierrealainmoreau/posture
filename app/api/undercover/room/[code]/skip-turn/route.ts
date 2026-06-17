import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { TURN_SECONDS } from "@/lib/undercover/types";
import { advanceTurn } from "@/lib/undercover/game-logic";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const { expectedPlayerId } = (await req.json()) as { expectedPlayerId: string };

  const admin = createAdminSupabaseClient();

  const { data: room } = await admin
    .from("undercover_rooms")
    .select("id, status, current_turn_player_id, turn_started_at, turn_order, round_number, session_count")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (room.status !== "description") return NextResponse.json({ ok: true });
  if (room.current_turn_player_id !== expectedPlayerId) return NextResponse.json({ ok: true });

  const elapsed = room.turn_started_at
    ? (Date.now() - new Date(room.turn_started_at).getTime()) / 1000
    : TURN_SECONDS + 1;

  if (elapsed < TURN_SECONDS - 2) return NextResponse.json({ ok: true });

  await admin.from("undercover_descriptions").upsert({
    room_id: room.id,
    player_id: expectedPlayerId,
    session_count: room.session_count,
    round_number: room.round_number,
    word: null,
  }, { onConflict: "room_id,player_id,session_count,round_number" });

  await advanceTurn(admin, room);

  return NextResponse.json({ ok: true });
}
