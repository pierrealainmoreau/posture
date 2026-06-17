import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { Winner } from "@/lib/undercover/types";
import { dispatchNotificationTrigger } from "@/lib/notifications/dispatch";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export async function advanceTurn(
  admin: AdminClient,
  room: { id: string; turn_order: string[]; round_number: number; session_count: number }
) {
  const { data: players } = await admin
    .from("undercover_players")
    .select("id, is_eliminated")
    .eq("room_id", room.id);

  const activePlayers = new Set(
    (players ?? []).filter((p) => !p.is_eliminated).map((p) => p.id)
  );

  const turnOrder = (room.turn_order ?? []).filter((id) => activePlayers.has(id));

  const { data: descs } = await admin
    .from("undercover_descriptions")
    .select("player_id")
    .eq("room_id", room.id)
    .eq("session_count", room.session_count)
    .eq("round_number", room.round_number);

  const described = new Set((descs ?? []).map((d) => d.player_id));
  const nextPlayerId = turnOrder.find((id) => !described.has(id)) ?? null;
  const now = new Date().toISOString();

  if (nextPlayerId) {
    await admin
      .from("undercover_rooms")
      .update({ current_turn_player_id: nextPlayerId, turn_started_at: now })
      .eq("id", room.id);
  } else {
    await admin
      .from("undercover_rooms")
      .update({ status: "discussion", current_turn_player_id: null, discussion_started_at: now })
      .eq("id", room.id);
  }
}

export async function resolveVotes(admin: AdminClient, roomId: string) {
  const { data: room } = await admin
    .from("undercover_rooms")
    .select("id, round_number, session_count")
    .eq("id", roomId)
    .single();

  if (!room) return;

  const { data: votes } = await admin
    .from("undercover_votes")
    .select("voted_player_id")
    .eq("room_id", roomId)
    .eq("session_count", room.session_count)
    .eq("round_number", room.round_number);

  if (!votes || votes.length === 0) return;

  const tally: Record<string, number> = {};
  for (const v of votes) {
    tally[v.voted_player_id] = (tally[v.voted_player_id] ?? 0) + 1;
  }

  const maxVotes = Math.max(...Object.values(tally));
  const topIds = Object.entries(tally).filter(([, c]) => c === maxVotes).map(([id]) => id);
  const eliminatedId = topIds[Math.floor(Math.random() * topIds.length)];

  const { data: eliminated } = await admin
    .from("undercover_players")
    .select("id, role")
    .eq("id", eliminatedId)
    .single();

  if (!eliminated) return;

  await admin.from("undercover_players").update({ is_eliminated: true }).eq("id", eliminatedId);

  if (eliminated.role === "mr_white") {
    await admin
      .from("undercover_rooms")
      .update({ status: "mr_white_guess", eliminated_player_id: eliminatedId })
      .eq("id", roomId);
    return;
  }

  await checkWinConditions(admin, roomId);
}

export async function checkWinConditions(admin: AdminClient, roomId: string) {
  const { data: players } = await admin
    .from("undercover_players")
    .select("id, role, is_eliminated")
    .eq("room_id", roomId);

  const active = (players ?? []).filter((p) => !p.is_eliminated);
  const civilCount = active.filter((p) => p.role === "civil").length;
  const undercoverCount = active.filter((p) => p.role === "undercover").length;
  const mrWhiteCount = active.filter((p) => p.role === "mr_white").length;

  if (undercoverCount === 0 && mrWhiteCount === 0) {
    await endGame(admin, roomId, "civils");
  } else if (civilCount <= 1) {
    await endGame(admin, roomId, "infiltres");
  } else {
    const { data: room } = await admin
      .from("undercover_rooms")
      .select("round_number, turn_order")
      .eq("id", roomId)
      .single();

    if (!room) return;

    const activeIds = new Set(active.map((p) => p.id));
    const nextTurnOrder = (room.turn_order as string[]).filter((id) => activeIds.has(id));
    const firstPlayerId = nextTurnOrder[0] ?? null;
    const now = new Date().toISOString();

    await admin
      .from("undercover_rooms")
      .update({
        status: "description",
        round_number: room.round_number + 1,
        current_turn_player_id: firstPlayerId,
        turn_started_at: now,
        eliminated_player_id: null,
      })
      .eq("id", roomId);
  }
}

export async function endGame(admin: AdminClient, roomId: string, winner: Winner) {
  const { data: players } = await admin
    .from("undercover_players")
    .select("id, role, total_score")
    .eq("room_id", roomId);

  for (const p of players ?? []) {
    let bonus = 0;
    if (winner === "civils" && p.role === "civil") bonus = 2;
    else if (winner === "infiltres" && p.role === "undercover") bonus = 10;
    else if (winner === "infiltres" && p.role === "mr_white") bonus = 6;

    if (bonus > 0) {
      await admin
        .from("undercover_players")
        .update({ total_score: (p.total_score ?? 0) + bonus })
        .eq("id", p.id);
    }
  }

  await admin.from("undercover_rooms").update({ status: "finished", winner }).eq("id", roomId);

  const { data: room } = await admin
    .from("undercover_rooms")
    .select("creator_user_id")
    .eq("id", roomId)
    .single();
  if (room?.creator_user_id) {
    await dispatchNotificationTrigger("minigame_completed", { userId: room.creator_user_id });
  }
}
