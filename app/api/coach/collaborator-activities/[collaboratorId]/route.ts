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

// GET /api/coach/collaborator-activities/[collaboratorId]
// Retourne l'historique des ateliers (sessions) liés à ce collaborateur
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

    // Vérifier que le collaborateur appartient à cet utilisateur
    const { data: collab } = await admin
      .from("collaborators")
      .select("id")
      .eq("id", collaboratorId)
      .eq("user_id", user.id)
      .single();

    if (!collab) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

    // Liens participant→collaborateur
    const { data: links } = await admin
      .from("session_participant_collaborator_links")
      .select("session_participant_id")
      .eq("user_id", user.id)
      .eq("collaborator_id", collaboratorId);

    if (!links?.length) return NextResponse.json({ sessions: [] });

    const participantIds = links.map((l) => l.session_participant_id);

    // Participants avec leur pseudo et session_id
    const { data: participants } = await admin
      .from("session_participants")
      .select("id, pseudo, session_id, joined_at")
      .in("id", participantIds);

    if (!participants?.length) return NextResponse.json({ sessions: [] });

    const sessionIds = [...new Set(participants.map((p) => p.session_id))];

    // Sessions
    const { data: sessions } = await admin
      .from("sessions")
      .select("id, code, name, created_at")
      .in("id", sessionIds)
      .order("created_at", { ascending: false });

    // Activités terminées pour ces sessions
    const { data: activities } = await admin
      .from("session_activities")
      .select("id, session_id, game_type, room_code, status, started_at")
      .in("session_id", sessionIds)
      .eq("status", "finished")
      .order("started_at", { ascending: true });

    if (!activities?.length) {
      return NextResponse.json({
        sessions: (sessions ?? []).map((s) => ({
          sessionId: s.id,
          sessionCode: s.code,
          sessionName: s.name,
          sessionDate: s.created_at,
          participantPseudo: participants.find((p) => p.session_id === s.id)?.pseudo ?? "",
          activities: [],
        })),
      });
    }

    // Récupérer les résultats humeur
    const humeurCodes = activities
      .filter((a) => a.game_type === "humeur")
      .map((a) => a.room_code);

    const pseudos = [...new Set(participants.map((p) => p.pseudo))];

    const humeurResultsMap: Record<string, string | null> = {};
    if (humeurCodes.length > 0) {
      const { data: humeurRooms } = await admin
        .from("humeur_rooms")
        .select("id, code")
        .in("code", humeurCodes);

      if (humeurRooms?.length) {
        const roomIds = humeurRooms.map((r) => r.id);
        const { data: humeurPlayers } = await admin
          .from("humeur_players")
          .select("room_id, pseudo, mood_id")
          .in("room_id", roomIds)
          .in("pseudo", pseudos);

        for (const player of humeurPlayers ?? []) {
          const room = humeurRooms.find((r) => r.id === player.room_id);
          if (room) {
            humeurResultsMap[`${room.code}::${player.pseudo}`] = player.mood_id;
          }
        }
      }
    }

    // Récupérer les résultats ROTI
    const rotiCodes = activities
      .filter((a) => a.game_type === "roti")
      .map((a) => a.room_code);

    const rotiResultsMap: Record<string, number | null> = {};
    if (rotiCodes.length > 0) {
      const { data: rotiRooms } = await admin
        .from("roti_rooms")
        .select("id, code")
        .in("code", rotiCodes);

      if (rotiRooms?.length) {
        const roomIds = rotiRooms.map((r) => r.id);
        const { data: rotiPlayers } = await admin
          .from("roti_players")
          .select("room_id, pseudo, vote")
          .in("room_id", roomIds)
          .in("pseudo", pseudos);

        for (const player of rotiPlayers ?? []) {
          const room = rotiRooms.find((r) => r.id === player.room_id);
          if (room) {
            rotiResultsMap[`${room.code}::${player.pseudo}`] = player.vote;
          }
        }
      }
    }

    // Construire la réponse groupée par session
    const result = (sessions ?? []).map((s) => {
      const participant = participants.find((p) => p.session_id === s.id);
      const pseudo = participant?.pseudo ?? "";
      const sessionActivities = (activities ?? [])
        .filter((a) => a.session_id === s.id)
        .map((a) => {
          let activityResult: unknown = null;

          if (a.game_type === "humeur") {
            const moodId = humeurResultsMap[`${a.room_code}::${pseudo}`] ?? null;
            const mood = moodId ? getMoodById(moodId) : null;
            activityResult = {
              type: "mood",
              moodId,
              moodLabel: mood?.label ?? null,
              moodSublabel: mood?.sublabel ?? null,
            };
          } else if (a.game_type === "roti") {
            const vote = rotiResultsMap[`${a.room_code}::${pseudo}`] ?? null;
            activityResult = { type: "roti", vote };
          } else {
            activityResult = { type: "participated" };
          }

          return {
            gameType: a.game_type,
            gameLabel: GAME_LABEL[a.game_type] ?? a.game_type,
            roomCode: a.room_code,
            startedAt: a.started_at,
            result: activityResult,
          };
        });

      return {
        sessionId: s.id,
        sessionCode: s.code,
        sessionName: s.name,
        sessionDate: s.created_at,
        participantPseudo: pseudo,
        activities: sessionActivities,
      };
    });

    return NextResponse.json({ sessions: result });
  } catch (err) {
    console.error("[GET /api/coach/collaborator-activities/[collaboratorId]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
