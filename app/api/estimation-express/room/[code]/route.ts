import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";
import { GUESS_SECONDS } from "@/lib/estimation-express/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Pragma": "no-cache",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const admin = createAdminSupabaseClient();
    const code = params.code.toUpperCase();

    const { data: room, error: roomErr } = await admin
      .from("estimation_express_rooms")
      .select("*")
      .eq("code", code)
      .single();

    if (roomErr || !room) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    // Auto-advance: if playing phase timed out → reveal
    if (room.status === "playing" && room.phase_started_at) {
      const elapsed = (Date.now() - new Date(room.phase_started_at).getTime()) / 1000;
      if (elapsed > GUESS_SECONDS + 3) {
        await admin
          .from("estimation_express_rooms")
          .update({ status: "reveal", phase_started_at: new Date().toISOString() })
          .eq("id", room.id);
        room.status = "reveal";
        room.phase_started_at = new Date().toISOString();
      }
    }

    const { data: players } = await admin
      .from("estimation_express_players")
      .select("id, room_id, pseudo, avatar_color, is_host, score, joined_at")
      .eq("room_id", room.id)
      .order("joined_at", { ascending: true });

    let guesses = null;
    if (room.current_question_index !== null) {
      const { data: guessData } = await admin
        .from("estimation_express_guesses")
        .select("player_id, value, points_earned, submitted_at")
        .eq("room_id", room.id)
        .eq("question_index", room.current_question_index)
        .order("submitted_at", { ascending: true });
      guesses = guessData;
    }

    return NextResponse.json({ room, players: players ?? [], guesses: guesses ?? [] }, {
      headers: NO_CACHE,
    });
  } catch (err) {
    console.error("[GET /api/estimation-express/room/[code]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const admin = createAdminSupabaseClient();
    const code = params.code.toUpperCase();
    const playerId = req.headers.get("X-Player-Id") ?? "";
    const secret = req.headers.get("X-Player-Secret");

    const { data: room } = await admin
      .from("estimation_express_rooms")
      .select("id, host_player_id")
      .eq("code", code)
      .single();

    if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

    const ok = await verifyPlayerSecret(admin, "estimation_express_players", playerId, secret);
    if (!ok || room.host_player_id !== playerId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await admin.from("estimation_express_rooms").delete().eq("id", room.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/estimation-express/room/[code]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
