import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";
import { dispatchNotificationTrigger } from "@/lib/notifications/dispatch";

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { playerId, votedTurnIndex } = (await req.json()) as {
    playerId: string;
    votedTurnIndex: number;
  };

  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "chaine_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const code = params.code.toUpperCase();

  const { data: room } = await admin
    .from("chaine_rooms")
    .select("id, status, player_order, creator_user_id")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  if (room.status !== "voting")
    return NextResponse.json({ error: "Phase de vote non active" }, { status: 409 });

  // Upsert: one vote per player
  const { error } = await admin.from("chaine_votes").upsert(
    { room_id: room.id, voter_player_id: playerId, voted_turn_index: votedTurnIndex },
    { onConflict: "room_id,voter_player_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check if everyone voted → finish
  const { data: votes } = await admin
    .from("chaine_votes")
    .select("voter_player_id")
    .eq("room_id", room.id);

  const allVoted = room.player_order.every((pid: string) =>
    (votes ?? []).some((v) => v.voter_player_id === pid)
  );

  if (allVoted) {
    await admin
      .from("chaine_rooms")
      .update({ status: "finished" })
      .eq("id", room.id);

    if (room.creator_user_id) {
      await dispatchNotificationTrigger("minigame_completed", { userId: room.creator_user_id });
    }
  }

  return NextResponse.json({ ok: true, finished: allVoted });
}
