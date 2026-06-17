import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ROOM_TABLE: Record<string, string> = {
  humeur:       "humeur_rooms",
  roti:         "roti_rooms",
  retrospective:"retro_rooms",
  abcde:        "abcde_rooms",
  kudo_cards:   "kudo_rooms",
  undercover:   "undercover_rooms",
  chaine:       "chaine_rooms",
  code_secret:  "code_secret_rooms",
  speed_retro:  "speed_retro_rooms",
  draw:         "draw_rooms",
  boussole:     "boussole_rooms",
  tribu:        "tribu_rooms",
};

// GET /api/game/[gameType]/[code]/collaborators
// Retourne les collaborateurs du manager (créateur de la room)
// Auth : session Supabase (le créateur de la room est authentifié)
export async function GET(
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

    // Vérifier que l'utilisateur est bien le créateur de cette room
    const { data: room } = await admin
      .from(roomTable)
      .select("creator_user_id")
      .eq("code", code.toUpperCase())
      .single();

    if (!room || room.creator_user_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { data: collaborators } = await admin
      .from("collaborators")
      .select("id, first_name, last_name, role")
      .eq("user_id", user.id)
      .order("first_name", { ascending: true });

    return NextResponse.json(
      { collaborators: collaborators ?? [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[GET /api/game/[gameType]/[code]/collaborators]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
