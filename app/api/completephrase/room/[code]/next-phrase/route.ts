import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// L'hôte avance manuellement à la phrase suivante (quand le timer expire)
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
      .select("id, host_player_id, status, current_phrase_index, starter_phrases, starter_phrase")
      .eq("code", params.code.toUpperCase())
      .single();

    if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    if (room.host_player_id !== playerId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    if (room.status !== "playing") return NextResponse.json({ error: "Session non en cours" }, { status: 409 });

    const phrases = (room.starter_phrases as string[] | null) ?? [room.starter_phrase];
    const currentIndex = room.current_phrase_index ?? 0;

    if (currentIndex + 1 < phrases.length) {
      await admin
        .from("completephrase_rooms")
        .update({
          current_phrase_index: currentIndex + 1,
          phrase_started_at: new Date().toISOString(),
        })
        .eq("id", room.id);
    } else {
      await admin
        .from("completephrase_rooms")
        .update({ status: "finished" })
        .eq("id", room.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/completephrase/room/[code]/next-phrase]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
