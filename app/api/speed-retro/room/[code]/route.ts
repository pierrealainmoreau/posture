import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const playerSecret = req.headers.get("X-Player-Secret");
  const admin = createAdminSupabaseClient();

  const { data: room, error: roomErr } = await admin
    .from("speed_retro_rooms")
    .select("*")
    .eq("code", code)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  const { data: players } = await admin
    .from("speed_retro_players")
    .select("id, room_id, pseudo, avatar_color, is_host, items_submitted, joined_at")
    .eq("room_id", room.id)
    .order("joined_at", { ascending: true });

  const response: Record<string, unknown> = {
    ...room,
    players: players ?? [],
  };

  if (room.status === "voting" || room.status === "finished") {
    const { data: rawItems } = await admin
      .from("speed_retro_items")
      .select("id, room_id, question_index, content, player_id")
      .eq("room_id", room.id);

    const itemIds = (rawItems ?? []).map((i) => i.id);

    const { data: votes } = itemIds.length > 0
      ? await admin
          .from("speed_retro_votes")
          .select("item_id, voter_player_id")
          .in("item_id", itemIds)
      : { data: [] };

    let voterPlayerId: string | null = null;
    if (playerSecret) {
      const { data: secretMatch } = await admin
        .from("speed_retro_players")
        .select("id")
        .eq("room_id", room.id)
        .eq("player_secret", playerSecret)
        .maybeSingle();
      if (secretMatch) voterPlayerId = secretMatch.id;
    }

    const items = (rawItems ?? []).map((item) => {
      const itemVotes = (votes ?? []).filter((v) => v.item_id === item.id);
      return {
        id: item.id,
        room_id: item.room_id,
        question_index: item.question_index,
        content: item.content,
        vote_count: itemVotes.length,
        my_vote: voterPlayerId
          ? itemVotes.some((v) => v.voter_player_id === voterPlayerId)
          : false,
      };
    });

    response.items = items;
  }

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    },
  });
}
