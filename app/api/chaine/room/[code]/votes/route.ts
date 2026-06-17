import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();

  const { data: room } = await admin
    .from("chaine_rooms")
    .select("id, status")
    .eq("code", params.code.toUpperCase())
    .single();

  if (!room) return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });

  const { data: votes } = await admin
    .from("chaine_votes")
    .select("*")
    .eq("room_id", room.id);

  return NextResponse.json(votes ?? [], {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
  });
}
