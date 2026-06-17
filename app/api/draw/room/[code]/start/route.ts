import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { pickRandomWords } from "@/lib/draw/words";
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
  const isValid = await verifyPlayerSecret(admin, "draw_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const code = params.code.toUpperCase();

  const { data: room } = await admin
    .from("draw_rooms")
    .select("id, host_player_id, word_theme, status")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  if (room.host_player_id !== playerId)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (room.status !== "lobby")
    return NextResponse.json({ error: "Déjà démarré" }, { status: 409 });

  const { data: players } = await admin
    .from("draw_players")
    .select("id")
    .eq("room_id", room.id)
    .order("joined_at");

  if (!players || players.length < 2) {
    return NextResponse.json(
      { error: "Il faut au moins 2 joueurs" },
      { status: 400 }
    );
  }

  const wordChoices = pickRandomWords(room.word_theme as string, 3);

  const { error } = await admin
    .from("draw_rooms")
    .update({
      status: "playing",
      current_round: 1,
      current_drawer_player_id: playerId,
      word_choices: wordChoices,
      current_word: null,
      round_started_at: null,
    })
    .eq("id", room.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
