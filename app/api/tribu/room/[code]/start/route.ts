import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { pickQuestions } from "@/lib/tribu/questions";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { playerId } = (await req.json()) as { playerId: string };
  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "tribu_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const code = params.code.toUpperCase();

  const { data: room } = await admin
    .from("tribu_rooms")
    .select("id, host_player_id, question_theme, question_count, status")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  if (room.host_player_id !== playerId)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (room.status !== "lobby")
    return NextResponse.json({ error: "Déjà démarré" }, { status: 409 });

  const { data: players } = await admin
    .from("tribu_players")
    .select("id")
    .eq("room_id", room.id);

  if (!players || players.length < 4) {
    return NextResponse.json({ error: "Il faut au moins 4 joueurs" }, { status: 400 });
  }

  const questionIds = pickQuestions(room.question_theme, room.question_count);

  const { error } = await admin
    .from("tribu_rooms")
    .update({ status: "playing", question_ids: questionIds })
    .eq("id", room.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
