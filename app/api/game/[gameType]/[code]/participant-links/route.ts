import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = { headers: { "Cache-Control": "no-store" } };

const ROOM_TABLE: Record<string, string> = {
  humeur:        "humeur_rooms",
  roti:          "roti_rooms",
  retrospective: "retro_rooms",
  abcde:         "abcde_rooms",
  kudo_cards:    "kudo_rooms",
  undercover:    "undercover_rooms",
  chaine:        "chaine_rooms",
  code_secret:   "code_secret_rooms",
  speed_retro:   "speed_retro_rooms",
  draw:          "draw_rooms",
  boussole:      "boussole_rooms",
  tribu:         "tribu_rooms",
};

// GET /api/game/[gameType]/[code]/participant-links
// Retourne les liens pseudo↔collaborateur existants pour cette room
export async function GET(
  req: NextRequest,
  { params }: { params: { gameType: string; code: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { gameType, code } = params;
    if (!ROOM_TABLE[gameType]) return NextResponse.json({ error: "Type de jeu non supporté" }, { status: 400 });

    const { data: links } = await supabase
      .from("session_participant_links")
      .select("player_pseudo, collaborator_id, collaborators(first_name, last_name)")
      .eq("user_id", user.id)
      .eq("session_type", gameType)
      .eq("room_code", code.toUpperCase());

    return NextResponse.json({ links: links ?? [] }, NO_CACHE);
  } catch (err) {
    console.error("[GET /api/game/[gameType]/[code]/participant-links]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/game/[gameType]/[code]/participant-links
// Crée ou supprime un lien pseudo↔collaborateur
// collaboratorId = null → supprime le lien
export async function POST(
  req: NextRequest,
  { params }: { params: { gameType: string; code: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { gameType, code } = params;
    const roomTable = ROOM_TABLE[gameType];
    if (!roomTable) return NextResponse.json({ error: "Type de jeu non supporté" }, { status: 400 });

    const admin = createAdminSupabaseClient();

    // Vérifier que l'utilisateur est le créateur de cette room
    const { data: room } = await admin
      .from(roomTable)
      .select("creator_user_id")
      .eq("code", code.toUpperCase())
      .single();

    if (!room || room.creator_user_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { playerPseudo, collaboratorId } = (await req.json()) as {
      playerPseudo: string;
      collaboratorId: string | null;
    };

    if (!playerPseudo?.trim()) {
      return NextResponse.json({ error: "playerPseudo manquant" }, { status: 400 });
    }

    const roomCode = code.toUpperCase();

    if (collaboratorId === null) {
      await supabase
        .from("session_participant_links")
        .delete()
        .eq("user_id", user.id)
        .eq("session_type", gameType)
        .eq("room_code", roomCode)
        .eq("player_pseudo", playerPseudo);

      return NextResponse.json({ ok: true, action: "unlinked" }, NO_CACHE);
    }

    // Vérifier que le collaborateur appartient à cet utilisateur
    const { data: collab } = await admin
      .from("collaborators")
      .select("id")
      .eq("id", collaboratorId)
      .eq("user_id", user.id)
      .single();

    if (!collab) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

    const { error } = await supabase
      .from("session_participant_links")
      .upsert(
        { user_id: user.id, session_type: gameType, room_code: roomCode, player_pseudo: playerPseudo, collaborator_id: collaboratorId },
        { onConflict: "user_id,session_type,room_code,player_pseudo" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, action: "linked" }, NO_CACHE);
  } catch (err) {
    console.error("[POST /api/game/[gameType]/[code]/participant-links]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
