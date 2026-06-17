import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { generatePlayerSecret, verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = { headers: { "Cache-Control": "no-store" } };
const PLACEHOLDER_UUID = "00000000-0000-0000-0000-000000000000";

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

type GameConfig = {
  roomTable: string;
  playerTable: string;
  hasPlayerSecret: boolean;
  hostPlayerIdNotNull: boolean;
  hasCreatorUserId: boolean;
  requiredGameParams: string[];
};

const GAME_CONFIG: Record<GameType, GameConfig> = {
  retrospective: {
    roomTable: "retro_rooms",
    playerTable: "retro_players",
    hasPlayerSecret: true,
    hostPlayerIdNotNull: false,
    hasCreatorUserId: true,
    requiredGameParams: [],
  },
  abcde: {
    roomTable: "abcde_rooms",
    playerTable: "abcde_players",
    hasPlayerSecret: false,
    hostPlayerIdNotNull: false,
    hasCreatorUserId: true,
    requiredGameParams: ["problem_statement"],
  },
  kudo_cards: {
    roomTable: "kudo_rooms",
    playerTable: "kudo_players",
    hasPlayerSecret: true,
    hostPlayerIdNotNull: false,
    hasCreatorUserId: true,
    requiredGameParams: [],
  },
  roti: {
    roomTable: "roti_rooms",
    playerTable: "roti_players",
    hasPlayerSecret: true,
    hostPlayerIdNotNull: false,
    hasCreatorUserId: true,
    requiredGameParams: [],
  },
  undercover: {
    roomTable: "undercover_rooms",
    playerTable: "undercover_players",
    hasPlayerSecret: true,
    hostPlayerIdNotNull: true,   // undercover_rooms.host_player_id NOT NULL, no default
    hasCreatorUserId: true,
    requiredGameParams: [],
  },
  chaine: {
    roomTable: "chaine_rooms",
    playerTable: "chaine_players",
    hasPlayerSecret: false,
    hostPlayerIdNotNull: true,
    hasCreatorUserId: true,
    requiredGameParams: ["starter_word"],
  },
  code_secret: {
    roomTable: "code_secret_rooms",
    playerTable: "code_secret_players",
    hasPlayerSecret: true,
    hostPlayerIdNotNull: false,
    hasCreatorUserId: true,
    requiredGameParams: ["challenge_id"],
  },
  speed_retro: {
    roomTable: "speed_retro_rooms",
    playerTable: "speed_retro_players",
    hasPlayerSecret: true,
    hostPlayerIdNotNull: false,
    hasCreatorUserId: true,
    requiredGameParams: [],
  },
  draw: {
    roomTable: "draw_rooms",
    playerTable: "draw_players",
    hasPlayerSecret: false,
    hostPlayerIdNotNull: false,
    hasCreatorUserId: true,
    requiredGameParams: [],
  },
  boussole: {
    roomTable: "boussole_rooms",
    playerTable: "boussole_players",
    hasPlayerSecret: true,
    hostPlayerIdNotNull: false,
    hasCreatorUserId: false,   // boussole_rooms n'a pas de colonne creator_user_id
    requiredGameParams: [],
  },
  humeur: {
    roomTable: "humeur_rooms",
    playerTable: "humeur_players",
    hasPlayerSecret: true,
    hostPlayerIdNotNull: false,
    hasCreatorUserId: true,
    requiredGameParams: [],
  },
  tribu: {
    roomTable: "tribu_rooms",
    playerTable: "tribu_players",
    hasPlayerSecret: true,
    hostPlayerIdNotNull: false,
    hasCreatorUserId: true,
    requiredGameParams: [],
  },
};

function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// POST /api/sessions/[code]/activities
// Lance un jeu dans la session et inscrit automatiquement tous les participants
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const admin = createAdminSupabaseClient();
    const sessionCode = params.code.toUpperCase();

    const body = (await req.json()) as {
      participantId: string;
      playerSecret: string;
      gameType: GameType;
      gameParams?: Record<string, unknown>;
    };

    const { participantId, playerSecret, gameType, gameParams = {} } = body;

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

    const { data: callerParticipant } = await admin
      .from("session_participants")
      .select("is_host, session_id")
      .eq("id", participantId)
      .single();

    if (!callerParticipant?.is_host) {
      return NextResponse.json({ error: "Seul l'hôte peut lancer une activité" }, { status: 403 });
    }

    // Récupération de la session
    const { data: session } = await admin
      .from("sessions")
      .select("id, status, host_user_id")
      .eq("code", sessionCode)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    if (session.status === "finished") {
      return NextResponse.json({ error: "Cette session est terminée" }, { status: 410 });
    }

    if (session.status === "playing") {
      return NextResponse.json({ error: "Une activité est déjà en cours" }, { status: 409 });
    }

    const config = GAME_CONFIG[gameType];
    if (!config) {
      return NextResponse.json({ error: "Type de jeu non supporté" }, { status: 400 });
    }

    // Validation des champs requis par le jeu
    for (const field of config.requiredGameParams) {
      if (!gameParams[field]) {
        return NextResponse.json(
          { error: `Champ requis pour ce jeu : ${field}` },
          { status: 400 }
        );
      }
    }

    // Récupération de tous les participants de la session
    const { data: participants } = await admin
      .from("session_participants")
      .select("id, pseudo, avatar_color, is_host, player_secret")
      .eq("session_id", session.id)
      .order("joined_at", { ascending: true });

    if (!participants?.length) {
      return NextResponse.json({ error: "Aucun participant trouvé" }, { status: 400 });
    }

    // Numéro de cette activité dans la session
    const { count } = await admin
      .from("session_activities")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id);

    const activityOrder = (count ?? 0) + 1;

    // Création de la room de jeu (avec retry sur collision de code)
    for (let attempt = 0; attempt < 5; attempt++) {
      const roomCode = generateCode();

      const roomInsert: Record<string, unknown> = {
        code: roomCode,
        session_id: session.id,
        ...(config.hasCreatorUserId ? { creator_user_id: session.host_user_id } : {}),
        ...buildRoomFields(gameType, gameParams),
      };

      if (config.hostPlayerIdNotNull) {
        roomInsert.host_player_id = PLACEHOLDER_UUID;
      }

      const { data: room, error: roomErr } = await admin
        .from(config.roomTable)
        .insert(roomInsert)
        .select("id, code")
        .single();

      if (roomErr) {
        if (roomErr.message.includes("unique")) continue;
        return NextResponse.json({ error: roomErr.message }, { status: 500 });
      }

      // Auto-inscription des participants comme joueurs du jeu
      const playerRows = participants.map((p) => {
        const row: Record<string, unknown> = {
          room_id: room.id,
          pseudo: p.pseudo,
          avatar_color: p.avatar_color,
          is_host: p.is_host,
        };
        if (config.hasPlayerSecret) {
          row.player_secret = p.player_secret;
        }
        return row;
      });

      const { data: gamePlayers, error: playersErr } = await admin
        .from(config.playerTable)
        .insert(playerRows)
        .select("id, is_host");

      if (playersErr || !gamePlayers?.length) {
        await admin.from(config.roomTable).delete().eq("id", room.id);
        return NextResponse.json(
          { error: playersErr?.message ?? "Erreur lors de l'inscription des joueurs" },
          { status: 500 }
        );
      }

      // Mise à jour de host_player_id sur la room
      const hostGamePlayer = gamePlayers.find((p) => p.is_host);
      if (hostGamePlayer) {
        await admin
          .from(config.roomTable)
          .update({ host_player_id: hostGamePlayer.id })
          .eq("id", room.id);
      }

      // Enregistrement de l'activité dans la session
      const { data: activity, error: activityErr } = await admin
        .from("session_activities")
        .insert({
          session_id: session.id,
          game_type: gameType,
          room_code: room.code,
          order: activityOrder,
          status: "active",
        })
        .select("id")
        .single();

      if (activityErr || !activity) {
        await admin.from(config.roomTable).delete().eq("id", room.id);
        return NextResponse.json({ error: activityErr?.message ?? "Erreur activité" }, { status: 500 });
      }

      // Session → playing
      await admin
        .from("sessions")
        .update({ status: "playing" })
        .eq("id", session.id);

      return NextResponse.json(
        {
          activityId: activity.id,
          roomCode: room.code,
          gameType,
          order: activityOrder,
          gamePlayers: buildPlayerMap(participants, gamePlayers),
        },
        NO_CACHE
      );
    }

    return NextResponse.json({ error: "Impossible de créer la room de jeu" }, { status: 500 });
  } catch (err) {
    console.error("[POST /api/sessions/[code]/activities]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Champs spécifiques à chaque jeu pour la création de la room
function buildRoomFields(
  gameType: GameType,
  gameParams: Record<string, unknown>
): Record<string, unknown> {
  switch (gameType) {
    case "abcde":
      return {
        problem_statement: gameParams.problem_statement,
        timer_per_step: gameParams.timer_per_step ?? null,
      };
    case "roti":
      return { session_name: gameParams.session_name ?? null };
    case "chaine":
      return { starter_word: gameParams.starter_word };
    case "code_secret":
      return {
        challenge_id: gameParams.challenge_id,
        difficulty: gameParams.difficulty ?? "easy",
        game_mode: gameParams.game_mode ?? "coop",
        time_limit_seconds: gameParams.time_limit_seconds ?? 600,
      };
    case "boussole":
      return { situation_count: gameParams.situation_count ?? 12 };
    case "tribu":
      return {
        question_theme: gameParams.question_theme ?? "all",
        question_count: gameParams.question_count ?? 10,
      };
    case "speed_retro":
      return {
        questions: gameParams.questions ?? undefined,
        vote_limit: gameParams.vote_limit ?? null,
        timer_enabled: gameParams.timer_enabled ?? true,
      };
    default:
      return {};
  }
}

// Retourne un mapping session_participant_id → game_player_id
// utile pour que le client sache quel player_id utiliser dans le jeu
function buildPlayerMap(
  participants: { id: string; is_host: boolean }[],
  gamePlayers: { id: string; is_host: boolean }[]
) {
  const hostParticipant = participants.find((p) => p.is_host);
  const hostGamePlayer = gamePlayers.find((p) => p.is_host);
  // On peut seulement mapper hôte ↔ hôte de façon fiable (ordre d'insertion garanti)
  return hostParticipant && hostGamePlayer
    ? { [hostParticipant.id]: hostGamePlayer.id }
    : {};
}
