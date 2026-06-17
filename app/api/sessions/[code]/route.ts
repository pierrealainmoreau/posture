import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = { headers: { "Cache-Control": "no-store" } };

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const admin = createAdminSupabaseClient();
    const code = params.code.toUpperCase();

    const { data: session, error } = await admin
      .from("sessions")
      .select("id, code, name, status, created_at")
      .eq("code", code)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    const [{ data: participants }, { data: activities }] = await Promise.all([
      admin
        .from("session_participants")
        .select("id, pseudo, avatar_color, is_host, joined_at")
        .eq("session_id", session.id)
        .order("joined_at", { ascending: true }),
      admin
        .from("session_activities")
        .select("id, game_type, room_code, order, status, started_at, finished_at")
        .eq("session_id", session.id)
        .order("order", { ascending: true }),
    ]);

    const currentActivity =
      (activities ?? []).find((a) => a.status === "active") ?? null;

    return NextResponse.json(
      {
        session: {
          id: session.id,
          code: session.code,
          name: session.name,
          status: session.status,
          created_at: session.created_at,
        },
        participants: participants ?? [],
        activities: activities ?? [],
        currentActivity,
      },
      NO_CACHE
    );
  } catch (err) {
    console.error("[GET /api/sessions/[code]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/sessions/[code] — terminer la session (host only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const admin = createAdminSupabaseClient();
    const code = params.code.toUpperCase();

    const { participantId, playerSecret } = (await req.json()) as {
      participantId: string;
      playerSecret: string;
    };

    const isValid = await verifyPlayerSecret(
      admin,
      "session_participants",
      participantId,
      playerSecret
    );
    if (!isValid) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { data: participant } = await admin
      .from("session_participants")
      .select("is_host, session_id")
      .eq("id", participantId)
      .single();

    if (!participant?.is_host) {
      return NextResponse.json({ error: "Seul l'hôte peut terminer la session" }, { status: 403 });
    }

    // Marquer l'activité en cours comme finished si besoin
    await admin
      .from("session_activities")
      .update({ status: "finished", finished_at: new Date().toISOString() })
      .eq("session_id", participant.session_id)
      .eq("status", "active");

    const { error } = await admin
      .from("sessions")
      .update({ status: "finished" })
      .eq("code", code);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, NO_CACHE);
  } catch (err) {
    console.error("[PATCH /api/sessions/[code]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
