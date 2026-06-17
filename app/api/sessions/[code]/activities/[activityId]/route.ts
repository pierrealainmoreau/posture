import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = { headers: { "Cache-Control": "no-store" } };

// PATCH /api/sessions/[code]/activities/[activityId]
// Marque l'activité en cours comme terminée, passe la session en between_games
export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string; activityId: string } }
) {
  try {
    const admin = createAdminSupabaseClient();
    const sessionCode = params.code.toUpperCase();
    const { activityId } = params;

    const { participantId, playerSecret } = (await req.json()) as {
      participantId: string;
      playerSecret: string;
    };

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
      return NextResponse.json(
        { error: "Seul l'hôte peut terminer une activité" },
        { status: 403 }
      );
    }

    // Vérification que l'activité appartient bien à cette session
    const { data: activity } = await admin
      .from("session_activities")
      .select("id, status, session_id")
      .eq("id", activityId)
      .single();

    if (!activity) {
      return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });
    }

    if (activity.session_id !== callerParticipant.session_id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    if (activity.status === "finished") {
      return NextResponse.json({ error: "Cette activité est déjà terminée" }, { status: 409 });
    }

    // Marquer l'activité comme finished
    const { error: activityErr } = await admin
      .from("session_activities")
      .update({ status: "finished", finished_at: new Date().toISOString() })
      .eq("id", activityId);

    if (activityErr) {
      return NextResponse.json({ error: activityErr.message }, { status: 500 });
    }

    // Passer la session en between_games
    const { error: sessionErr } = await admin
      .from("sessions")
      .update({ status: "between_games" })
      .eq("code", sessionCode);

    if (sessionErr) {
      return NextResponse.json({ error: sessionErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, NO_CACHE);
  } catch (err) {
    console.error("[PATCH /api/sessions/[code]/activities/[activityId]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
