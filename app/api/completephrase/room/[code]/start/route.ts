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
    const { playerId } = (await req.json()) as { playerId: string };
    const admin = createAdminSupabaseClient();
    const playerSecret = req.headers.get("X-Player-Secret");
    const isValid = await verifyPlayerSecret(admin, "completephrase_players", playerId, playerSecret);
    if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const { data: room } = await admin
      .from("completephrase_rooms")
      .select("id, host_player_id, status")
      .eq("code", params.code.toUpperCase())
      .single();

    if (!room) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    if (room.host_player_id !== playerId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    if (room.status !== "lobby") return NextResponse.json({ error: "Déjà démarrée" }, { status: 409 });

    const { data: players } = await admin
      .from("completephrase_players")
      .select("id")
      .eq("room_id", room.id);

    if (!players || players.length < 2) {
      return NextResponse.json({ error: "Il faut au moins 2 participants" }, { status: 400 });
    }

    // Démarre le jeu et initialise le timer de la 1ère phrase
    await admin
      .from("completephrase_rooms")
      .update({ status: "playing", current_phrase_index: 0, phrase_started_at: new Date().toISOString() })
      .eq("id", room.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/completephrase/room/[code]/start]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
