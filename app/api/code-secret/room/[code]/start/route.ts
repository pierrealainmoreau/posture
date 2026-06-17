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
    const code = params.code.toUpperCase();
    const body = (await req.json()) as { playerId: string };
    const playerSecret = req.headers.get("X-Player-Secret");

    const admin = createAdminSupabaseClient();

    const isValid = await verifyPlayerSecret(admin, "code_secret_players", body.playerId, playerSecret);
    if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const { data: room } = await admin
      .from("code_secret_rooms")
      .select("id, status, host_player_id")
      .eq("code", code)
      .single();

    if (!room) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });
    if (room.host_player_id !== body.playerId) return NextResponse.json({ error: "Seul l'hôte peut démarrer" }, { status: 403 });
    if (room.status !== "lobby") return NextResponse.json({ error: "La partie a déjà commencé" }, { status: 409 });

    const { count } = await admin
      .from("code_secret_players")
      .select("id", { count: "exact", head: true })
      .eq("room_id", room.id);

    if (!count || count < 2) return NextResponse.json({ error: "Il faut au moins 2 joueurs" }, { status: 400 });

    const { error } = await admin
      .from("code_secret_rooms")
      .update({ status: "playing", started_at: new Date().toISOString() })
      .eq("id", room.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
