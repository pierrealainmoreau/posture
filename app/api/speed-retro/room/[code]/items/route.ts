import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const playerSecret = req.headers.get("X-Player-Secret");
  const { playerId, items } = (await req.json()) as {
    playerId: string;
    items: Array<{ questionIndex: number; content: string }>;
  };

  if (!playerId) {
    return NextResponse.json({ error: "playerId manquant" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const valid = await verifyPlayerSecret(admin, "speed_retro_players", playerId, playerSecret);
  if (!valid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { data: room, error: roomErr } = await admin
    .from("speed_retro_rooms")
    .select("id, status")
    .eq("code", code)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  if (room.status !== "writing") {
    return NextResponse.json({ error: "La phase d'écriture n'est pas active" }, { status: 409 });
  }

  const validItems = (items ?? []).filter(
    (it) => it.content?.trim() && it.questionIndex >= 0 && it.questionIndex <= 3
  );

  if (validItems.length > 0) {
    const rows = validItems.map((it) => ({
      room_id: room.id,
      player_id: playerId,
      question_index: it.questionIndex,
      content: it.content.trim(),
    }));

    const { error: insertErr } = await admin.from("speed_retro_items").insert(rows);
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
  }

  await admin
    .from("speed_retro_players")
    .update({ items_submitted: true })
    .eq("id", playerId);

  return NextResponse.json({ ok: true });
}
