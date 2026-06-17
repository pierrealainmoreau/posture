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
    const { playerId, choice } = (await req.json()) as { playerId: string; choice: "a" | "b" };
    if (!playerId || !choice || !["a", "b"].includes(choice)) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const playerSecret = req.headers.get("X-Player-Secret");
    const isValid = await verifyPlayerSecret(admin, "thisorthat_players", playerId, playerSecret);
    if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const { data: room } = await admin
      .from("thisorthat_rooms")
      .select("id, status, current_question_index")
      .eq("code", params.code.toUpperCase())
      .single();

    if (!room) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });
    if (room.status !== "playing") return NextResponse.json({ error: "Partie non en cours" }, { status: 409 });

    const { error } = await admin
      .from("thisorthat_votes")
      .upsert(
        {
          room_id: room.id,
          player_id: playerId,
          question_index: room.current_question_index,
          choice,
        },
        { onConflict: "room_id,player_id,question_index" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/thisorthat/room/[code]/vote]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
