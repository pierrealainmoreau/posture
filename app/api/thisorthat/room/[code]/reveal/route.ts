import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId } = (await req.json()) as { playerId: string };
    const admin = createAdminSupabaseClient();
    const playerSecret = req.headers.get("X-Player-Secret");
    const isValid = await verifyPlayerSecret(admin, "thisorthat_players", playerId, playerSecret);
    if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const { data: room } = await admin
      .from("thisorthat_rooms")
      .select("id, host_player_id, status")
      .eq("code", params.code.toUpperCase())
      .single();

    if (!room) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    if (room.host_player_id !== playerId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    if (room.status !== "playing") return NextResponse.json({ error: "Partie non en cours" }, { status: 409 });

    await admin.from("thisorthat_rooms").update({ show_results: true }).eq("id", room.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/thisorthat/room/[code]/reveal]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
