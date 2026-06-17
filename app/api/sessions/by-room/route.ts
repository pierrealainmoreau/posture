import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = { headers: { "Cache-Control": "no-store" } };

type GameType =
  | "retrospective" | "abcde" | "kudo_cards" | "roti"
  | "undercover" | "chaine" | "code_secret" | "speed_retro" | "draw"
  | "boussole" | "humeur" | "tribu" | "thisorthat" | "completephrase";

const ROOM_TABLE: Record<GameType, string> = {
  retrospective: "retro_rooms",
  abcde:         "abcde_rooms",
  kudo_cards:    "kudo_rooms",
  roti:          "roti_rooms",
  undercover:    "undercover_rooms",
  chaine:        "chaine_rooms",
  code_secret:   "code_secret_rooms",
  speed_retro:   "speed_retro_rooms",
  draw:          "draw_rooms",
  boussole:      "boussole_rooms",
  humeur:        "humeur_rooms",
  tribu:         "tribu_rooms",
  thisorthat:    "thisorthat_rooms",
  completephrase: "completephrase_rooms",
};

// GET /api/sessions/by-room?gameType=retrospective&roomCode=ABC123
// Retourne les infos de session si la room appartient à une session, sinon null
export async function GET(req: NextRequest) {
  try {
    const gameType = req.nextUrl.searchParams.get("gameType") as GameType | null;
    const roomCode = req.nextUrl.searchParams.get("roomCode")?.toUpperCase();

    if (!gameType || !roomCode || !ROOM_TABLE[gameType]) {
      return NextResponse.json({ session: null }, NO_CACHE);
    }

    const admin = createAdminSupabaseClient();

    // Récupérer la room et son session_id
    const { data: room } = await admin
      .from(ROOM_TABLE[gameType])
      .select("id, session_id")
      .eq("code", roomCode)
      .single();

    if (!room?.session_id) {
      return NextResponse.json({ session: null }, NO_CACHE);
    }

    // Récupérer les infos de la session
    const { data: session } = await admin
      .from("sessions")
      .select("id, code, status")
      .eq("id", room.session_id)
      .single();

    if (!session || session.status === "finished") {
      return NextResponse.json({ session: null }, NO_CACHE);
    }

    // Récupérer l'activité en cours liée à cette room
    const { data: activity } = await admin
      .from("session_activities")
      .select("id, status")
      .eq("session_id", session.id)
      .eq("room_code", roomCode)
      .single();

    return NextResponse.json(
      {
        session: {
          sessionCode: session.code,
          sessionId:   session.id,
          activityId:  activity?.id ?? null,
          activityStatus: activity?.status ?? null,
        },
      },
      NO_CACHE
    );
  } catch (err) {
    console.error("[GET /api/sessions/by-room]", err);
    return NextResponse.json({ session: null }, NO_CACHE);
  }
}
