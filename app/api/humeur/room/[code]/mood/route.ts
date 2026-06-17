import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { MOODS } from "@/lib/humeur/moods";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { playerId, moodId } = (await req.json()) as {
    playerId: string;
    moodId: string;
  };

  if (!playerId || !moodId) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }
  if (!MOODS.find((m) => m.id === moodId)) {
    return NextResponse.json({ error: "Humeur invalide" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "humeur_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const { data: room } = await admin
    .from("humeur_rooms")
    .select("id, status")
    .eq("code", params.code.toUpperCase())
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (room.status !== "playing") {
    return NextResponse.json({ error: "Partie non en cours" }, { status: 409 });
  }

  const { data: player } = await admin
    .from("humeur_players")
    .select("id")
    .eq("id", playerId)
    .eq("room_id", room.id)
    .single();

  if (!player) return NextResponse.json({ error: "Joueur inconnu" }, { status: 403 });

  const { error } = await admin
    .from("humeur_players")
    .update({ mood_id: moodId })
    .eq("id", playerId)
    .eq("room_id", room.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
