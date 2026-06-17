import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();
  const { playerId, rating, comment } = await req.json() as {
    playerId: string;
    rating: number;
    comment?: string;
  };

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Note invalide (1–5)" }, { status: 400 });
  }

  const { data: room } = await admin
    .from("abcde_rooms")
    .select("id, status")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (room.status !== "step_e") return NextResponse.json({ error: "Uniquement à l'étape E" }, { status: 409 });

  await admin
    .from("abcde_evaluations")
    .upsert(
      { room_id: room.id, player_id: playerId, rating, comment: comment?.trim() ?? null },
      { onConflict: "player_id,room_id" }
    );

  return NextResponse.json({ ok: true });
}
