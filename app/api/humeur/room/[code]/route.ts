import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();

  const { data: room, error: roomErr } = await admin
    .from("humeur_rooms")
    .select("*")
    .eq("code", code)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  const { data: players } = await admin
    .from("humeur_players")
    .select("id, room_id, pseudo, avatar_color, is_host, mood_id, joined_at")
    .eq("room_id", room.id)
    .order("joined_at", { ascending: true });

  return NextResponse.json(
    { ...room, players: players ?? [] },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
      },
    }
  );
}
