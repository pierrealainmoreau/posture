import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const { data: room } = await admin
    .from("tribu_rooms")
    .select("id")
    .eq("code", params.code.toUpperCase())
    .single();
  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  const { data: result } = await admin
    .from("tribu_results")
    .select("*")
    .eq("room_id", room.id)
    .single();

  if (!result) return NextResponse.json({ error: "Résultats non disponibles" }, { status: 404 });
  return NextResponse.json(result);
}
