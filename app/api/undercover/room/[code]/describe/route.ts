import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";
import { advanceTurn } from "@/lib/undercover/game-logic";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const { playerId, word } = (await req.json()) as { playerId: string; word: string };

  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "undercover_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { data: room } = await admin
    .from("undercover_rooms")
    .select("id, status, current_turn_player_id, turn_order, round_number, session_count")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (room.status !== "description") return NextResponse.json({ error: "Mauvaise phase" }, { status: 409 });
  if (room.current_turn_player_id !== playerId) return NextResponse.json({ error: "Pas votre tour" }, { status: 409 });

  const trimmed = (word ?? "").trim();
  if (!trimmed) return NextResponse.json({ error: "Mot requis" }, { status: 400 });

  await admin.from("undercover_descriptions").upsert({
    room_id: room.id,
    player_id: playerId,
    session_count: room.session_count,
    round_number: room.round_number,
    word: trimmed,
  }, { onConflict: "room_id,player_id,session_count,round_number" });

  await advanceTurn(admin, room);

  return NextResponse.json({ ok: true }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
  });
}
