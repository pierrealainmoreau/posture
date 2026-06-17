import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { playerId } = (await req.json()) as { playerId: string };
  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "chaine_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const code = params.code.toUpperCase();

  const { data: room } = await admin
    .from("chaine_rooms")
    .select("id, host_player_id, status, starter_word")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  if (room.host_player_id !== playerId)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (room.status !== "lobby")
    return NextResponse.json({ error: "Déjà démarré" }, { status: 409 });

  const { data: players } = await admin
    .from("chaine_players")
    .select("id")
    .eq("room_id", room.id)
    .order("joined_at");

  if (!players || players.length < 2) {
    return NextResponse.json({ error: "Il faut au moins 2 joueurs" }, { status: 400 });
  }

  // Shuffle player order; with ≤3 players each player plays twice
  const baseOrder = [...players.map((p) => p.id)].sort(() => Math.random() - 0.5);
  const shuffled = players.length <= 3 ? [...baseOrder, ...baseOrder] : baseOrder;

  // Insert the starter word at turn_index 0
  await admin.from("chaine_words").insert({
    room_id: room.id,
    player_id: null,
    turn_index: 0,
    word: room.starter_word,
  });

  const now = new Date().toISOString();

  const { error } = await admin
    .from("chaine_rooms")
    .update({
      status: "playing",
      player_order: shuffled,
      current_turn_index: 1,
      turn_started_at: now,
    })
    .eq("id", room.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
