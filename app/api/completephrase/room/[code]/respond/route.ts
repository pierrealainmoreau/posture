import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, response, phraseIndex: rawIndex } = (await req.json()) as {
      playerId: string;
      response: string;
      phraseIndex?: number;
    };

    if (!playerId || !response?.trim()) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }
    if (response.trim().length > 280) {
      return NextResponse.json({ error: "Réponse trop longue (280 caractères max)" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const playerSecret = req.headers.get("X-Player-Secret");
    const isValid = await verifyPlayerSecret(admin, "completephrase_players", playerId, playerSecret);
    if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const { data: room } = await admin
      .from("completephrase_rooms")
      .select("id, status, current_phrase_index, starter_phrases, starter_phrase")
      .eq("code", params.code.toUpperCase())
      .single();

    if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    if (room.status !== "playing") return NextResponse.json({ error: "Session non en cours" }, { status: 409 });

    const currentIndex = room.current_phrase_index ?? 0;
    const phraseIndex  = rawIndex ?? currentIndex;

    // Récupère les réponses actuelles du joueur
    const { data: playerRow } = await admin
      .from("completephrase_players")
      .select("responses, response")
      .eq("id", playerId)
      .single();

    const prevResponses = (playerRow?.responses as (string | null)[] | null) ?? [];
    const newResponses  = [...prevResponses];
    while (newResponses.length <= phraseIndex) newResponses.push(null);
    newResponses[phraseIndex] = response.trim();

    const { error: updateErr } = await admin
      .from("completephrase_players")
      .update({ responses: newResponses, response: phraseIndex === 0 ? response.trim() : playerRow?.response })
      .eq("id", playerId)
      .eq("room_id", room.id);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Vérifie si tous les joueurs ont répondu à cette phrase
    const { data: allPlayers } = await admin
      .from("completephrase_players")
      .select("id, responses")
      .eq("room_id", room.id);

    const allDone = (allPlayers ?? []).every((p) => {
      const resp = (p.id === playerId ? newResponses : (p.responses as (string | null)[] | null)) ?? [];
      return resp[phraseIndex] != null && resp[phraseIndex] !== "";
    });

    if (allDone) {
      const phrases = (room.starter_phrases as string[] | null) ?? [room.starter_phrase];
      const totalPhrases = phrases.length;

      if (phraseIndex + 1 < totalPhrases) {
        // Auto-avance à la phrase suivante
        await admin
          .from("completephrase_rooms")
          .update({
            current_phrase_index: phraseIndex + 1,
            phrase_started_at: new Date().toISOString(),
          })
          .eq("id", room.id);
      } else {
        // Dernière phrase terminée
        await admin
          .from("completephrase_rooms")
          .update({ status: "finished" })
          .eq("id", room.id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/completephrase/room/[code]/respond]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
