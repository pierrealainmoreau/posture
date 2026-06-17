import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getChallengeById } from "@/lib/code-secret/challenges";
import type { ChallengeClient } from "@/lib/code-secret/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HEADERS = { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", "Pragma": "no-cache" };

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase();
    const admin = createAdminSupabaseClient();

    const { data: room, error } = await admin
      .from("code_secret_rooms")
      .select("*")
      .eq("code", code)
      .single();

    if (error || !room) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });

    // Auto-expire timer if playing
    if (room.status === "playing" && room.started_at) {
      const elapsed = (Date.now() - new Date(room.started_at).getTime()) / 1000;
      if (elapsed >= room.time_limit_seconds) {
        await admin.from("code_secret_rooms").update({ status: "finished" }).eq("id", room.id);
        room.status = "finished";
      }
    }

    const [{ data: players }, { data: hints }, { data: subs }] = await Promise.all([
      admin.from("code_secret_players").select("id, room_id, pseudo, avatar_color, is_host, team, joined_at").eq("room_id", room.id).order("joined_at"),
      admin.from("code_secret_revealed_hints").select("hint_index, team, revealed_at").eq("room_id", room.id).order("revealed_at"),
      admin.from("code_secret_submissions").select("team, answer, is_correct, submitted_at").eq("room_id", room.id).order("submitted_at", { ascending: false }).limit(20),
    ]);

    const challenge = getChallengeById(room.challenge_id);
    if (!challenge) return NextResponse.json({ error: "Défi introuvable" }, { status: 500 });

    // Return challenge without the answer (unless game is finished)
    const challengeClient: ChallengeClient = {
      id: challenge.id,
      title: challenge.title,
      encodedMessage: challenge.encodedMessage,
      maxHints: challenge.maxHints,
      hintPenalty: challenge.hintPenalty,
      wrongGuessPenalty: challenge.wrongGuessPenalty,
      cipherDescription: challenge.cipherDescription,
      difficulty: challenge.difficulty,
      timeLimitSeconds: challenge.timeLimitSeconds,
      ...(room.status === "finished" ? { answer: challenge.answer } : {}),
    };

    // Attach hint texts for revealed hints
    const revealedHints = (hints ?? []).map((h) => ({
      hint_index: h.hint_index,
      text: challenge.hints[h.hint_index] ?? "",
      team: h.team,
      revealed_at: h.revealed_at,
    }));

    return NextResponse.json(
      {
        ...room,
        players: players ?? [],
        challenge: challengeClient,
        revealedHints,
        recentSubmissions: subs ?? [],
      },
      { headers: HEADERS }
    );
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
