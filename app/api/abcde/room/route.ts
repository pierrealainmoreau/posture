import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise pour créer une session" }, { status: 401 });

  const { pseudo, avatarColor, problemStatement, timerPerStep } = await req.json() as {
    pseudo: string;
    avatarColor: string;
    problemStatement: string;
    timerPerStep?: number;
  };

  if (!pseudo?.trim()) return NextResponse.json({ error: "Pseudo requis" }, { status: 400 });
  if (!problemStatement?.trim()) return NextResponse.json({ error: "Sujet de travail requis" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  for (let i = 0; i < 5; i++) {
    const code = generateCode();

    const { data: room, error: roomErr } = await admin
      .from("abcde_rooms")
      .insert({
        code,
        problem_statement: problemStatement.trim(),
        timer_per_step: timerPerStep && timerPerStep > 0 ? timerPerStep : null,
        creator_user_id: user.id,
      })
      .select("id, code")
      .single();

    if (roomErr) {
      if (roomErr.message.includes("unique")) continue;
      return NextResponse.json({ error: roomErr.message }, { status: 500 });
    }

    const { data: player, error: playerErr } = await admin
      .from("abcde_players")
      .insert({
        room_id: room.id,
        pseudo: pseudo.trim(),
        avatar_color: avatarColor ?? "#3b82f6",
        is_host: true,
      })
      .select("id")
      .single();

    if (playerErr || !player) {
      await admin.from("abcde_rooms").delete().eq("id", room.id);
      return NextResponse.json({ error: playerErr?.message ?? "Erreur joueur" }, { status: 500 });
    }

    await admin.from("abcde_rooms").update({ host_player_id: player.id }).eq("id", room.id);

    return NextResponse.json({ code: room.code, playerId: player.id });
  }

  return NextResponse.json({ error: "Impossible de créer la session" }, { status: 500 });
}
