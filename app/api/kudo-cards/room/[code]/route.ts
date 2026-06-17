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
    .from("kudo_rooms")
    .select("*")
    .eq("code", code)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  const { data: rawPlayers } = await admin
    .from("kudo_players")
    .select("id, room_id, pseudo, avatar_color, is_host, joined_at")
    .eq("room_id", room.id)
    .order("joined_at", { ascending: true });

  const players = rawPlayers ?? [];

  let authors_count: number | undefined;
  let cards = undefined;

  if (room.status === "writing") {
    const { data: cardRows } = await admin
      .from("kudo_cards")
      .select("author_id")
      .eq("room_id", room.id);
    const uniqueAuthors = new Set((cardRows ?? []).map((c) => c.author_id));
    authors_count = uniqueAuthors.size;
  }

  if (room.status === "revealed") {
    const { data: cardRows } = await admin
      .from("kudo_cards")
      .select("id, category, message, created_at, author_id, recipient_id")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true });

    const playerMap = new Map(players.map((p) => [p.id, p]));

    cards = (cardRows ?? []).map((c) => ({
      id: c.id,
      category: c.category,
      message: c.message,
      created_at: c.created_at,
      author: playerMap.get(c.author_id) ?? { id: c.author_id, pseudo: "?", avatar_color: "#6b7280" },
      recipient: playerMap.get(c.recipient_id) ?? { id: c.recipient_id, pseudo: "?", avatar_color: "#6b7280" },
    }));
  }

  return NextResponse.json(
    { ...room, players, authors_count, cards },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
      },
    }
  );
}
