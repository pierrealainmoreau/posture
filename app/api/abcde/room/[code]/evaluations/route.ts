import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Pragma": "no-cache",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();

  const { data: room } = await admin
    .from("abcde_rooms")
    .select("id")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404, headers: NO_CACHE });

  const { data: evals } = await admin
    .from("abcde_evaluations")
    .select("rating, comment")
    .eq("room_id", room.id);

  return NextResponse.json(evals ?? [], { headers: NO_CACHE });
}
