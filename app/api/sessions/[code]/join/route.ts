import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { generatePlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const admin = createAdminSupabaseClient();
    const code = params.code.toUpperCase();

    const { pseudo, avatarColor } = (await req.json()) as {
      pseudo: string;
      avatarColor: string;
    };

    if (!pseudo?.trim()) {
      return NextResponse.json({ error: "Pseudo manquant" }, { status: 400 });
    }
    if (pseudo.trim().length > 32) {
      return NextResponse.json({ error: "Pseudo trop long (32 caractères maximum)" }, { status: 400 });
    }

    const { data: session, error: sessionErr } = await admin
      .from("sessions")
      .select("id, status")
      .eq("code", code)
      .single();

    if (sessionErr || !session) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    if (session.status === "playing") {
      return NextResponse.json(
        { error: "Un jeu est en cours, vous pourrez rejoindre entre deux activités" },
        { status: 409 }
      );
    }

    if (session.status === "finished") {
      return NextResponse.json({ error: "Cette session est terminée" }, { status: 410 });
    }

    const { count: participantCount } = await admin
      .from("session_participants")
      .select("*", { count: "exact", head: true })
      .eq("session_id", session.id);

    if ((participantCount ?? 0) >= 200) {
      return NextResponse.json({ error: "Session pleine (200 participants maximum)" }, { status: 409 });
    }

    const playerSecret = generatePlayerSecret();

    const { data: participant, error: participantErr } = await admin
      .from("session_participants")
      .insert({
        session_id: session.id,
        pseudo: pseudo.trim(),
        avatar_color: avatarColor ?? "#3b82f6",
        is_host: false,
        player_secret: playerSecret,
      })
      .select("id")
      .single();

    if (participantErr || !participant) {
      return NextResponse.json(
        { error: participantErr?.message ?? "Erreur lors de l'inscription" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { participantId: participant.id, playerSecret, sessionId: session.id },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[POST /api/sessions/[code]/join]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
