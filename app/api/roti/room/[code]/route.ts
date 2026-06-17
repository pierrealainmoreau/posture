import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const admin = createAdminSupabaseClient();

  const { data: room, error: roomErr } = await admin
    .from("roti_rooms")
    .select("*")
    .eq("code", code)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  const { data: rawPlayers } = await admin
    .from("roti_players")
    .select("id, room_id, pseudo, avatar_color, is_host, vote, joined_at")
    .eq("room_id", room.id)
    .order("joined_at", { ascending: true });

  const players = (rawPlayers ?? []).map((p) => ({
    ...p,
    vote: room.status === "finished" ? p.vote : null,
  }));

  const voted_count = (rawPlayers ?? []).filter((p) => p.vote !== null).length;

  return NextResponse.json(
    { ...room, players, voted_count },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
      },
    }
  );
}
