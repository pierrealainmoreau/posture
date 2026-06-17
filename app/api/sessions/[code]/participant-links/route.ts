import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = { headers: { "Cache-Control": "no-store" } };

// GET /api/sessions/[code]/participant-links?participantId=...&playerSecret=...
// Retourne les liens participant↔collaborateur existants pour la session
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const admin = createAdminSupabaseClient();
    const code = params.code.toUpperCase();

    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get("participantId");
    const playerSecret  = searchParams.get("playerSecret");

    if (!participantId || !playerSecret) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const isValid = await verifyPlayerSecret(admin, "session_participants", participantId, playerSecret);
    if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const { data: caller } = await admin
      .from("session_participants")
      .select("is_host, session_id")
      .eq("id", participantId)
      .single();

    if (!caller?.is_host) return NextResponse.json({ error: "Réservé à l'hôte" }, { status: 403 });

    const { data: session } = await admin
      .from("sessions")
      .select("id, host_user_id")
      .eq("code", code)
      .single();

    if (!session?.host_user_id) return NextResponse.json({ links: [] }, NO_CACHE);

    // Récupérer tous les participants de la session
    const { data: allParticipants } = await admin
      .from("session_participants")
      .select("id")
      .eq("session_id", caller.session_id);

    const participantIds = (allParticipants ?? []).map((p) => p.id);
    if (participantIds.length === 0) return NextResponse.json({ links: [] }, NO_CACHE);

    const { data: links } = await admin
      .from("session_participant_collaborator_links")
      .select("session_participant_id, collaborator_id, collaborators(first_name, last_name)")
      .eq("user_id", session.host_user_id)
      .in("session_participant_id", participantIds);

    return NextResponse.json({ links: links ?? [] }, NO_CACHE);
  } catch (err) {
    console.error("[GET /api/sessions/[code]/participant-links]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/sessions/[code]/participant-links
// Crée ou supprime un lien participant↔collaborateur
// collaboratorId = null → supprime le lien
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const admin = createAdminSupabaseClient();
    const code = params.code.toUpperCase();

    const { hostParticipantId, playerSecret, targetParticipantId, collaboratorId } =
      (await req.json()) as {
        hostParticipantId: string;
        playerSecret: string;
        targetParticipantId: string;
        collaboratorId: string | null;
      };

    if (!hostParticipantId || !playerSecret || !targetParticipantId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const isValid = await verifyPlayerSecret(admin, "session_participants", hostParticipantId, playerSecret);
    if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const { data: caller } = await admin
      .from("session_participants")
      .select("is_host, session_id")
      .eq("id", hostParticipantId)
      .single();

    if (!caller?.is_host) return NextResponse.json({ error: "Réservé à l'hôte" }, { status: 403 });

    const { data: session } = await admin
      .from("sessions")
      .select("host_user_id")
      .eq("code", code)
      .single();

    if (!session?.host_user_id) {
      return NextResponse.json({ error: "Session sans hôte identifié" }, { status: 400 });
    }

    // Vérifier que targetParticipantId appartient bien à cette session
    const { data: target } = await admin
      .from("session_participants")
      .select("id")
      .eq("id", targetParticipantId)
      .eq("session_id", caller.session_id)
      .single();

    if (!target) return NextResponse.json({ error: "Participant introuvable" }, { status: 404 });

    if (collaboratorId === null) {
      // Suppression du lien
      await admin
        .from("session_participant_collaborator_links")
        .delete()
        .eq("user_id", session.host_user_id)
        .eq("session_participant_id", targetParticipantId);

      return NextResponse.json({ ok: true, action: "unlinked" }, NO_CACHE);
    }

    // Vérifier que le collaborateur appartient à cet utilisateur
    const { data: collab } = await admin
      .from("collaborators")
      .select("id")
      .eq("id", collaboratorId)
      .eq("user_id", session.host_user_id)
      .single();

    if (!collab) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

    // Upsert du lien
    const { error: upsertErr } = await admin
      .from("session_participant_collaborator_links")
      .upsert(
        {
          user_id: session.host_user_id,
          session_participant_id: targetParticipantId,
          collaborator_id: collaboratorId,
        },
        { onConflict: "user_id,session_participant_id" }
      );

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, action: "linked" }, NO_CACHE);
  } catch (err) {
    console.error("[POST /api/sessions/[code]/participant-links]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
