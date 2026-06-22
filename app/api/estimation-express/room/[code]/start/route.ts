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
    const admin = createAdminSupabaseClient();
    const code = params.code.toUpperCase();
    const playerId = req.headers.get("X-Player-Id") ?? "";
    const secret = req.headers.get("X-Player-Secret");

    const { data: room, error: roomErr } = await admin
      .from("estimation_express_rooms")
      .select("id, host_player_id, status")
      .eq("code", code)
      .single();

    if (roomErr || !room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    if (room.status !== "lobby") return NextResponse.json({ error: "Déjà démarrée" }, { status: 409 });

    const ok = await verifyPlayerSecret(admin, "estimation_express_players", playerId, secret);
    if (!ok || room.host_player_id !== playerId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await admin
      .from("estimation_express_rooms")
      .update({ status: "playing", current_question_index: 0, phase_started_at: new Date().toISOString() })
      .eq("id", room.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/estimation-express/room/[code]/start]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
