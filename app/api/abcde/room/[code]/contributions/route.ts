import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Pragma": "no-cache",
};

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();
  const { playerId, step, content, category } = await req.json() as {
    playerId: string;
    step: string;
    content: string;
    category?: string;
  };

  if (!content?.trim()) return NextResponse.json({ error: "Contenu requis" }, { status: 400 });

  const { data: room } = await admin
    .from("abcde_rooms")
    .select("id, status")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  const expectedStatuses: Record<string, string> = {
    a: "step_a", b: "step_b", d: "step_d",
  };
  const expected = expectedStatuses[step];
  if (expected && room.status !== expected) {
    return NextResponse.json({ error: "Cette étape n'est pas active" }, { status: 409 });
  }

  const { data: contribution, error } = await admin
    .from("abcde_contributions")
    .insert({
      room_id: room.id,
      player_id: playerId,
      step,
      content: content.trim(),
      category: category ?? null,
    })
    .select("id, content, category, created_at")
    .single();

  if (error || !contribution) {
    return NextResponse.json({ error: error?.message ?? "Erreur" }, { status: 500 });
  }

  return NextResponse.json(contribution, { headers: NO_CACHE });
}
