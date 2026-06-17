import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = { headers: { "Cache-Control": "no-store" } };

type GameType =
  | "retrospective"
  | "abcde"
  | "kudo_cards"
  | "roti"
  | "undercover"
  | "chaine"
  | "code_secret"
  | "speed_retro"
  | "draw"
  | "boussole"
  | "humeur"
  | "tribu";

// Jeux qui stockent player_secret dans leur table players
const GAMES_WITH_SECRET = new Set<GameType>([
  "retrospective",
  "kudo_cards",
  "roti",
  "undercover",
  "code_secret",
  "speed_retro",
  "boussole",
  "humeur",
  "tribu",
]);

const PLAYER_TABLE: Record<GameType, string> = {
  retrospective: "retro_players",
  abcde:         "abcde_players",
  kudo_cards:    "kudo_players",
  roti:          "roti_players",
  undercover:    "undercover_players",
  chaine:        "chaine_players",
  code_secret:   "code_secret_players",
  speed_retro:   "speed_retro_players",
  draw:          "draw_players",
  boussole:      "boussole_players",
  humeur:        "humeur_players",
  tribu:         "tribu_players",
};

const ROOM_TABLE: Record<GameType, string> = {
  retrospective: "retro_rooms",
  abcde:         "abcde_rooms",
  kudo_cards:    "kudo_rooms",
  roti:          "roti_rooms",
  undercover:    "undercover_rooms",
  chaine:        "chaine_rooms",
  code_secret:   "code_secret_rooms",
  speed_retro:   "speed_retro_rooms",
  draw:          "draw_rooms",
  boussole:      "boussole_rooms",
  humeur:        "humeur_rooms",
  tribu:         "tribu_rooms",
};

// GET /api/sessions/[code]/activities/[activityId]/my-player
// Retourne le game_player_id du participant dans le jeu lancé
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string; activityId: string } }
) {
  try {
    const admin = createAdminSupabaseClient();
    const { activityId } = params;

    const participantId = req.nextUrl.searchParams.get("participantId");
    const playerSecret  = req.nextUrl.searchParams.get("playerSecret");

    if (!participantId || !playerSecret) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Vérification d'identité
    const isValid = await verifyPlayerSecret(
      admin,
      "session_participants",
      participantId,
      playerSecret
    );
    if (!isValid) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Récupération du participant (pseudo + session_id)
    const { data: participant } = await admin
      .from("session_participants")
      .select("pseudo, session_id")
      .eq("id", participantId)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Participant introuvable" }, { status: 404 });
    }

    // Récupération de l'activité (game_type + room_code)
    const { data: activity } = await admin
      .from("session_activities")
      .select("game_type, room_code, session_id")
      .eq("id", activityId)
      .single();

    if (!activity) {
      return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });
    }

    if (activity.session_id !== participant.session_id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const gameType = activity.game_type as GameType;
    const playerTable = PLAYER_TABLE[gameType];
    const roomTable   = ROOM_TABLE[gameType];

    if (!playerTable) {
      return NextResponse.json({ error: "Type de jeu non supporté" }, { status: 400 });
    }

    // Récupération de l'id de la room à partir du code
    const { data: room } = await admin
      .from(roomTable)
      .select("id")
      .eq("code", activity.room_code)
      .single();

    if (!room) {
      return NextResponse.json({ error: "Room introuvable" }, { status: 404 });
    }

    // Recherche du game_player :
    // - Si le jeu stocke player_secret → on matche par secret (exact, sans ambiguïté)
    // - Sinon → on matche par pseudo dans cette room
    let query = admin
      .from(playerTable)
      .select("id")
      .eq("room_id", room.id);

    if (GAMES_WITH_SECRET.has(gameType)) {
      query = query.eq("player_secret", playerSecret);
    } else {
      query = query.eq("pseudo", participant.pseudo);
    }

    const { data: gamePlayer } = await query.single();

    if (!gamePlayer) {
      return NextResponse.json({ error: "Joueur non trouvé dans ce jeu" }, { status: 404 });
    }

    return NextResponse.json({ gamePlayerId: gamePlayer.id }, NO_CACHE);
  } catch (err) {
    console.error("[GET /api/sessions/.../my-player]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
