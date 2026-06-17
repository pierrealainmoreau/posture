import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const { searchParams } = new URL(req.url);
  const round = parseInt(searchParams.get("round") ?? "0");

  const { data: room } = await admin
    .from("draw_rooms")
    .select("id")
    .eq("code", params.code.toUpperCase())
    .single();
  if (!room) return NextResponse.json([]);

  const { data } = await admin
    .from("draw_strokes")
    .select("stroke_data")
    .eq("room_id", room.id)
    .eq("round_number", round)
    .order("created_at");

  return NextResponse.json(
    (data ?? []).map((d: { stroke_data: unknown }) => d.stroke_data),
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
      },
    }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { strokeData, roundNumber } = (await req.json()) as {
    strokeData: unknown;
    roundNumber: number;
  };

  if (!strokeData || !roundNumber) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }
  if (
    !strokeData ||
    typeof strokeData !== 'object' ||
    Array.isArray(strokeData) ||
    !Array.isArray((strokeData as Record<string, unknown>).points) ||
    ((strokeData as Record<string, unknown>).points as unknown[]).length > 10000
  ) {
    return NextResponse.json({ error: "strokeData invalide" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: room } = await admin
    .from("draw_rooms")
    .select("id")
    .eq("code", params.code.toUpperCase())
    .single();
  if (!room) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

  await admin.from("draw_strokes").insert({
    room_id: room.id,
    round_number: roundNumber,
    stroke_data: strokeData,
  });

  return NextResponse.json({ ok: true });
}
