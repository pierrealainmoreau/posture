import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";
import { pickWordPair, RECENT_PAIRS_WINDOW } from "@/lib/undercover/word-pairs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const { playerId } = (await req.json()) as { playerId: string };

  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "undercover_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { data: room } = await admin
    .from("undercover_rooms")
    .select("id, host_player_id, status, nb_undercovers, nb_mr_whites")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (room.host_player_id !== playerId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (room.status !== "lobby") return NextResponse.json({ error: "Déjà démarré" }, { status: 409 });

  const { data: players } = await admin
    .from("undercover_players")
    .select("id")
    .eq("room_id", room.id)
    .order("joined_at");

  const playerList = players ?? [];
  const minPlayers = room.nb_undercovers + room.nb_mr_whites + 1;

  if (playerList.length < 3) {
    return NextResponse.json({ error: "Il faut au moins 3 joueurs" }, { status: 400 });
  }
  if (playerList.length <= minPlayers) {
    return NextResponse.json({
      error: `Avec cette config, il faut au moins ${minPlayers + 1} joueurs (actuellement ${playerList.length})`,
    }, { status: 400 });
  }

  // Pick a word pair not used in the last RECENT_PAIRS_WINDOW rooms globally
  const { data: recentRooms } = await admin
    .from("undercover_rooms")
    .select("pair_index")
    .not("pair_index", "is", null)
    .order("created_at", { ascending: false })
    .limit(RECENT_PAIRS_WINDOW);

  const recentIndices = (recentRooms ?? [])
    .map((r) => r.pair_index as number)
    .filter((i) => i !== null);

  const { pair, index: pairIndex } = await pickWordPair(recentIndices);

  // Shuffle players and assign roles
  const shuffled = [...playerList].sort(() => Math.random() - 0.5);
  const roleAssignments: { id: string; role: string; secret_word: string | null }[] = [];

  for (let i = 0; i < shuffled.length; i++) {
    let role: string;
    let secret_word: string | null;

    if (i < room.nb_undercovers) {
      role = "undercover";
      secret_word = pair.undercover;
    } else if (i < room.nb_undercovers + room.nb_mr_whites) {
      role = "mr_white";
      secret_word = null;
    } else {
      role = "civil";
      secret_word = pair.civil;
    }

    roleAssignments.push({ id: shuffled[i].id, role, secret_word });
  }

  // Assign roles in DB
  for (const { id, role, secret_word } of roleAssignments) {
    await admin
      .from("undercover_players")
      .update({ role, secret_word })
      .eq("id", id);
  }

  // Turn order: civils first among the shuffled, then others (just use shuffled order)
  const turnOrder = shuffled.map((p) => p.id);
  const firstPlayerId = turnOrder[0];
  const now = new Date().toISOString();

  const { error } = await admin
    .from("undercover_rooms")
    .update({
      status: "description",
      civil_word: pair.civil,
      undercover_word: pair.undercover,
      pair_index: pairIndex,
      turn_order: turnOrder,
      current_turn_player_id: firstPlayerId,
      turn_started_at: now,
      round_number: 1,
    })
    .eq("id", room.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
