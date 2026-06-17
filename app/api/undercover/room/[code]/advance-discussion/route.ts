import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { DISCUSSION_SECONDS } from "@/lib/undercover/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const { playerId } = (await req.json()) as { playerId?: string };

  const admin = createAdminSupabaseClient();

  const { data: room } = await admin
    .from("undercover_rooms")
    .select("id, status, host_player_id, discussion_started_at")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (room.status !== "discussion") return NextResponse.json({ ok: true });

  const isHost = playerId && room.host_player_id === playerId;
  const elapsed = room.discussion_started_at
    ? (Date.now() - new Date(room.discussion_started_at).getTime()) / 1000
    : DISCUSSION_SECONDS + 1;

  // Allow if host triggered manually OR timer expired
  if (!isHost && elapsed < DISCUSSION_SECONDS - 2) {
    return NextResponse.json({ error: "Temps non écoulé" }, { status: 409 });
  }

  const { error } = await admin
    .from("undercover_rooms")
    .update({ status: "voting" })
    .eq("id", room.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
