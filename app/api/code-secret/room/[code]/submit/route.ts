import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getChallengeById, normalizeAnswer } from "@/lib/code-secret/challenges";
import { dispatchNotificationTrigger } from "@/lib/notifications/dispatch";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase();
    const body = (await req.json()) as { playerId: string; answer: string; team?: string | null };
    const { playerId, answer, team = null } = body;

    if (!playerId || !answer?.trim()) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();

    const { data: room } = await admin
      .from("code_secret_rooms")
      .select("id, status, game_mode, challenge_id, started_at, time_limit_seconds, creator_user_id")
      .eq("code", code)
      .single();

    if (!room) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });
    if (room.status !== "playing") return NextResponse.json({ error: "La partie n\'est pas en cours" }, { status: 409 });

    // Check timer
    if (room.started_at) {
      const elapsed = (Date.now() - new Date(room.started_at).getTime()) / 1000;
      if (elapsed >= room.time_limit_seconds) {
        await admin.from("code_secret_rooms").update({ status: "finished" }).eq("id", room.id);
        return NextResponse.json({ correct: false, expired: true });
      }
    }

    // Verify player
    const { data: player } = await admin
      .from("code_secret_players")
      .select("id, team")
      .eq("id", playerId)
      .eq("room_id", room.id)
      .single();

    if (!player) return NextResponse.json({ error: "Joueur introuvable" }, { status: 403 });

    const effectiveTeam = room.game_mode === "competitive" ? (player.team ?? team) : null;

    const challenge = getChallengeById(room.challenge_id);
    if (!challenge) return NextResponse.json({ error: "Défi introuvable" }, { status: 500 });

    const isCorrect = normalizeAnswer(answer) === normalizeAnswer(challenge.answer);

    await admin.from("code_secret_submissions").insert({
      room_id: room.id,
      team: effectiveTeam,
      player_id: playerId,
      answer: answer.trim(),
      is_correct: isCorrect,
    });

    if (isCorrect) {
      if (room.game_mode === "competitive" && effectiveTeam) {
        // First team to get it right wins; only update if still playing
        await admin
          .from("code_secret_rooms")
          .update({ status: "finished", winner_team: effectiveTeam, solved_at: new Date().toISOString() })
          .eq("id", room.id)
          .eq("status", "playing");
      } else {
        await admin
          .from("code_secret_rooms")
          .update({ status: "finished", solved_at: new Date().toISOString() })
          .eq("id", room.id)
          .eq("status", "playing");
      }

      if (room.creator_user_id) {
        await dispatchNotificationTrigger("minigame_completed", { userId: room.creator_user_id });
      }
    }

    return NextResponse.json({ correct: isCorrect, answer: isCorrect ? challenge.answer : undefined });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
