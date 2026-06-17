import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  noStore();
  const code = params.code.toUpperCase();
  const admin = createAdminSupabaseClient();

  const { data: room, error: roomError } = await admin
    .from("boussole_rooms")
    .select("id")
    .eq("code", code)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room introuvable" }, { status: 404 });
  }

  const { data: resultRow, error: resultError } = await admin
    .from("boussole_results")
    .select("results, team_map")
    .eq("room_id", room.id)
    .order("computed_at", { ascending: false })
    .limit(1)
    .single();

  if (resultError || !resultRow) {
    return NextResponse.json({ error: "Résultats introuvables" }, { status: 404 });
  }

  // Guard against legacy rows that were stored with JSON.stringify (string inside jsonb)
  const results = typeof resultRow.results === "string"
    ? JSON.parse(resultRow.results)
    : resultRow.results;
  const teamMap = typeof resultRow.team_map === "string"
    ? JSON.parse(resultRow.team_map)
    : resultRow.team_map;

  return NextResponse.json({ results, teamMap });
}
