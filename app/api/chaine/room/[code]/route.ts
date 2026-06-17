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

  const { data: room } = await admin
    .from("chaine_rooms")
    .select("*")
    .eq("code", code)
    .single();

  if (!room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 }, );
  }

  const [{ data: players }, { data: words }] = await Promise.all([
    admin.from("chaine_players").select("*").eq("room_id", room.id).order("joined_at"),
    admin.from("chaine_words").select("*").eq("room_id", room.id).order("turn_index"),
  ]);

  return NextResponse.json(
    { ...room, players: players ?? [], words: words ?? [] },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", "Pragma": "no-cache" } }
  );
}
