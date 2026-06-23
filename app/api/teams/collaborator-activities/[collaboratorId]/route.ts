import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { getMoodById } from "@/lib/humeur/moods";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const GAME_LABEL: Record<string, string> = {
  retrospective: "Rétrospective",
  abcde:         "ABCDE",
  kudo_cards:    "Kudo Cards",
  roti:          "ROTI",
  undercover:    "Undercover",
  chaine:        "La Chaîne",
  code_secret:   "Code Secret",
  speed_retro:   "Speed Rétro",
  draw:          "Draw",
  boussole:      "Boussole",
  humeur:        "Humeur du jour",
  tribu:         "Tribu",
};

const GAME_ROOM_TABLE: Record<string, string> = {
  humeur:        "humeur_rooms",
  roti:          "roti_rooms",
  retrospective: "retro_rooms",
  abcde:         "abcde_rooms",
  kudo_cards:    "kudo_rooms",
  undercover:    "undercover_rooms",
  chaine:        "chaine_rooms",
  code_secret:   "code_secret_rooms",
  speed_retro:   "speed_retro_rooms",
  draw:          "draw_rooms",
  boussole:      "boussole_rooms",
  tribu:         "tribu_rooms",
};

// GET /api/teams/collaborator-activities/[collaboratorId]
// Retourne l'historique des ateliers liés à ce collaborateur, deux chemins :
// Chemin A : session_participant_collaborator_links → session_participants → sessions → session_activities
// Chemin B : session_participant_links → rooms directes (humeur, roti, etc.)
export async function GET(
  req: NextRequest,
  { params }: { params: { collaboratorId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const { collaboratorId } = params;

    const { data: collab } = await admin
      .from("collaborators")
      .select("id")
      .eq("id", collaboratorId)
      .eq("user_id", user.id)
      .single();

    if (!collab) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

    const [pathAResults, pathBResults] = await Promise.all([
      getPathASessions(admin, user.id, collaboratorId),
      getPathBSessions(admin, user.id, collaboratorId),
    ]);

    const all = [...pathAResults, ...pathBResults].sort(
      (a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
    );

    return NextResponse.json({ sessions: all });
  } catch (err) {
    console.error("[GET /api/teams/collaborator-activities/[collaboratorId]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── Chemin A : liens créés depuis la page hôte de session multijoueur ─────────
async function getPathASessions(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
  collaboratorId: string
) {
  const { data: links } = await admin
    .from("session_participant_collaborator_links")
    .select("session_participant_id")
    .eq("user_id", userId)
    .eq("collaborator_id", collaboratorId);

  if (!links?.length) return [];

  const participantIds = links.map((l) => l.session_participant_id);

  const { data: participants } = await admin
    .from("session_participants")
    .select("id, pseudo, session_id, joined_at")
    .in("id", participantIds);

  if (!participants?.length) return [];

  const sessionIds = [...new Set(participants.map((p) => p.session_id))];

  const { data: sessions } = await admin
    .from("sessions")
    .select("id, code, name, created_at")
    .in("id", sessionIds)
    .order("created_at", { ascending: false });

  const { data: activities } = await admin
    .from("session_activities")
    .select("id, session_id, game_type, room_code, status, started_at")
    .in("session_id", sessionIds)
    .eq("status", "finished")
    .order("started_at", { ascending: true });

  if (!activities?.length) {
    return (sessions ?? []).map((s) => ({
      sessionId: s.id,
      sessionCode: s.code,
      sessionName: s.name,
      sessionDate: s.created_at,
      participantPseudo: participants.find((p) => p.session_id === s.id)?.pseudo ?? "",
      activities: [],
    }));
  }

  const pseudos = [...new Set(participants.map((p) => p.pseudo))];
  const humeurMap = await loadHumeurResults(admin, activities, pseudos);
  const rotiMap   = await loadRotiResults(admin, activities, pseudos);

  return (sessions ?? []).map((s) => {
    const pseudo = participants.find((p) => p.session_id === s.id)?.pseudo ?? "";
    return {
      sessionId: s.id,
      sessionCode: s.code,
      sessionName: s.name,
      sessionDate: s.created_at,
      participantPseudo: pseudo,
      activities: (activities ?? [])
        .filter((a) => a.session_id === s.id)
        .map((a) => buildActivityResult(a.game_type, a.room_code, a.started_at, pseudo, humeurMap, rotiMap)),
    };
  });
}

// ── Chemin B : liens créés depuis le lobby d'un jeu (humeur, roti, etc.) ──────
async function getPathBSessions(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
  collaboratorId: string
) {
  const { data: links } = await admin
    .from("session_participant_links")
    .select("session_type, room_code, player_pseudo")
    .eq("user_id", userId)
    .eq("collaborator_id", collaboratorId);

  if (!links?.length) return [];

  const results = [];

  for (const link of links) {
    const roomTable = GAME_ROOM_TABLE[link.session_type];
    if (!roomTable) continue;

    const { data: room } = await admin
      .from(roomTable)
      .select("id, code, created_at")
      .eq("code", link.room_code)
      .single();

    if (!room) continue;

    let activityResult: {
      type: "mood"; moodId: string | null; moodLabel: string | null; moodSublabel: string | null;
    } | { type: "roti"; vote: number | null } | { type: "participated" } = { type: "participated" };

    if (link.session_type === "humeur") {
      const { data: player } = await admin
        .from("humeur_players")
        .select("mood_id")
        .eq("room_id", room.id)
        .eq("pseudo", link.player_pseudo)
        .maybeSingle();

      const moodId = player?.mood_id ?? null;
      const mood = moodId ? getMoodById(moodId) : null;
      activityResult = { type: "mood", moodId, moodLabel: mood?.label ?? null, moodSublabel: mood?.sublabel ?? null };
    } else if (link.session_type === "roti") {
      const { data: player } = await admin
        .from("roti_players")
        .select("vote")
        .eq("room_id", room.id)
        .eq("pseudo", link.player_pseudo)
        .maybeSingle();

      activityResult = { type: "roti", vote: player?.vote ?? null };
    }

    results.push({
      sessionId: `standalone_${link.session_type}_${room.code}`,
      sessionCode: room.code,
      sessionName: null as string | null,
      sessionDate: room.created_at,
      participantPseudo: link.player_pseudo,
      activities: [{
        gameType: link.session_type,
        gameLabel: GAME_LABEL[link.session_type] ?? link.session_type,
        roomCode: room.code,
        startedAt: room.created_at,
        result: activityResult,
      }],
    });
  }

  return results;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loadHumeurResults(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  activities: Array<{ game_type: string; room_code: string }>,
  pseudos: string[]
) {
  const map: Record<string, string | null> = {};
  const codes = activities.filter((a) => a.game_type === "humeur").map((a) => a.room_code);
  if (!codes.length) return map;

  const { data: rooms } = await admin.from("humeur_rooms").select("id, code").in("code", codes);
  if (!rooms?.length) return map;

  const { data: players } = await admin
    .from("humeur_players")
    .select("room_id, pseudo, mood_id")
    .in("room_id", rooms.map((r) => r.id))
    .in("pseudo", pseudos);

  for (const p of players ?? []) {
    const room = rooms.find((r) => r.id === p.room_id);
    if (room) map[`${room.code}::${p.pseudo}`] = p.mood_id;
  }
  return map;
}

async function loadRotiResults(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  activities: Array<{ game_type: string; room_code: string }>,
  pseudos: string[]
) {
  const map: Record<string, number | null> = {};
  const codes = activities.filter((a) => a.game_type === "roti").map((a) => a.room_code);
  if (!codes.length) return map;

  const { data: rooms } = await admin.from("roti_rooms").select("id, code").in("code", codes);
  if (!rooms?.length) return map;

  const { data: players } = await admin
    .from("roti_players")
    .select("room_id, pseudo, vote")
    .in("room_id", rooms.map((r) => r.id))
    .in("pseudo", pseudos);

  for (const p of players ?? []) {
    const room = rooms.find((r) => r.id === p.room_id);
    if (room) map[`${room.code}::${p.pseudo}`] = p.vote;
  }
  return map;
}

function buildActivityResult(
  gameType: string,
  roomCode: string,
  startedAt: string,
  pseudo: string,
  humeurMap: Record<string, string | null>,
  rotiMap: Record<string, number | null>
) {
  let result: unknown;

  if (gameType === "humeur") {
    const moodId = humeurMap[`${roomCode}::${pseudo}`] ?? null;
    const mood = moodId ? getMoodById(moodId) : null;
    result = { type: "mood", moodId, moodLabel: mood?.label ?? null, moodSublabel: mood?.sublabel ?? null };
  } else if (gameType === "roti") {
    result = { type: "roti", vote: rotiMap[`${roomCode}::${pseudo}`] ?? null };
  } else {
    result = { type: "participated" };
  }

  return {
    gameType,
    gameLabel: GAME_LABEL[gameType] ?? gameType,
    roomCode,
    startedAt,
    result,
  };
}
