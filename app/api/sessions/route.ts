import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { generatePlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Connexion requise pour créer une session" }, { status: 401 });
    }

    const body = (await req.json()) as { pseudo: string; avatarColor: string; name?: string };
    const { pseudo, avatarColor, name } = body;
    if (!pseudo?.trim()) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();

    for (let i = 0; i < 5; i++) {
      const code = generateCode();

      const { data: session, error: sessionErr } = await admin
        .from("sessions")
        .insert({ code, host_user_id: user.id, name: name?.trim() || null })
        .select("id, code")
        .single();

      if (sessionErr) {
        if (sessionErr.message.includes("unique")) continue;
        return NextResponse.json({ error: sessionErr.message }, { status: 500 });
      }

      const playerSecret = generatePlayerSecret();

      const { data: participant, error: participantErr } = await admin
        .from("session_participants")
        .insert({
          session_id: session.id,
          pseudo: pseudo.trim(),
          avatar_color: avatarColor ?? "#3b82f6",
          is_host: true,
          player_secret: playerSecret,
        })
        .select("id")
        .single();

      if (participantErr || !participant) {
        await admin.from("sessions").delete().eq("id", session.id);
        return NextResponse.json({ error: participantErr?.message ?? "Erreur participant" }, { status: 500 });
      }

      return NextResponse.json(
        { code: session.code, sessionId: session.id, participantId: participant.id, playerSecret },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json({ error: "Impossible de créer la session" }, { status: 500 });
  } catch (err) {
    console.error("[POST /api/sessions]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
