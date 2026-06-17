import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getChallengeById } from "@/lib/code-secret/challenges";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase();
    const body = (await req.json()) as { playerId: string; hintIndex: number; team?: string | null };
    const { playerId, hintIndex, team = null } = body;

    if (!playerId || hintIndex === undefined) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();

    const { data: room } = await admin
      .from("code_secret_rooms")
      .select("id, status, game_mode, challenge_id")
      .eq("code", code)
      .single();

    if (!room) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });
    if (room.status !== "playing") return NextResponse.json({ error: "La partie n\'est pas en cours" }, { status: 409 });

    // Verify player belongs to room
    const { data: player } = await admin
      .from("code_secret_players")
      .select("id, team")
      .eq("id", playerId)
      .eq("room_id", room.id)
      .single();

    if (!player) return NextResponse.json({ error: "Joueur introuvable" }, { status: 403 });

    const challenge = getChallengeById(room.challenge_id);
    if (!challenge) return NextResponse.json({ error: "Défi introuvable" }, { status: 500 });
    if (hintIndex < 0 || hintIndex >= challenge.hints.length) {
      return NextResponse.json({ error: "Indice invalide" }, { status: 400 });
    }
    if (hintIndex >= challenge.maxHints) {
      return NextResponse.json({ error: "Plus d\'indices disponibles" }, { status: 400 });
    }

    // In competitive mode, team must match player's team
    const effectiveTeam = room.game_mode === "competitive" ? (player.team ?? team) : null;

    // Check if already revealed
    const existingQuery = admin
      .from("code_secret_revealed_hints")
      .select("id")
      .eq("room_id", room.id)
      .eq("hint_index", hintIndex);

    const { data: existing } = effectiveTeam
      ? await existingQuery.eq("team", effectiveTeam)
      : await existingQuery.is("team", null);

    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true, text: challenge.hints[hintIndex], alreadyRevealed: true });
    }

    const { error } = await admin.from("code_secret_revealed_hints").insert({
      room_id: room.id,
      hint_index: hintIndex,
      team: effectiveTeam,
      revealed_by_player_id: playerId,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, text: challenge.hints[hintIndex] });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
