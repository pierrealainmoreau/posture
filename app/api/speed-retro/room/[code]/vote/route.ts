import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const playerSecret = req.headers.get("X-Player-Secret");
  const { playerId, itemId } = (await req.json()) as { playerId: string; itemId: string };

  if (!playerId || !itemId) {
    return NextResponse.json({ error: "playerId ou itemId manquant" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const valid = await verifyPlayerSecret(admin, "speed_retro_players", playerId, playerSecret);
  if (!valid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { data: room, error: roomErr } = await admin
    .from("speed_retro_rooms")
    .select("id, status, vote_limit")
    .eq("code", code)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  if (room.status !== "voting") {
    return NextResponse.json({ error: "Le vote n'est pas actif" }, { status: 409 });
  }

  const { data: existingVote } = await admin
    .from("speed_retro_votes")
    .select("id")
    .eq("voter_player_id", playerId)
    .eq("item_id", itemId)
    .maybeSingle();

  if (existingVote) {
    await admin.from("speed_retro_votes").delete().eq("id", existingVote.id);
    return NextResponse.json({ ok: true, action: "removed" });
  }

  if (room.vote_limit !== null) {
    const { count } = await admin
      .from("speed_retro_votes")
      .select("id", { count: "exact", head: true })
      .eq("voter_player_id", playerId)
      .eq("room_id", room.id);

    if ((count ?? 0) >= room.vote_limit) {
      return NextResponse.json({ error: "Budget de votes épuisé" }, { status: 409 });
    }
  }

  const { error: insertErr } = await admin.from("speed_retro_votes").insert({
    room_id: room.id,
    voter_player_id: playerId,
    item_id: itemId,
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, action: "added" });
}
