import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  // Opt out of Next.js data cache for every fetch() called in this handler.
  // Without this, Supabase JS makes GET requests that Next.js silently caches,
  // causing newly-inserted rows to be invisible until the cache expires.
  noStore();

  const code = params.code.toUpperCase();
  const admin = createAdminSupabaseClient();

  const { data: room, error } = await admin
    .from("boussole_rooms")
    .select("*")
    .eq("code", code)
    .single();

  if (error || !room) {
    return NextResponse.json({ error: "Room introuvable" }, { status: 404 });
  }

  // Note: do NOT add .order("joined_at") here — Supabase/PostgREST silently
  // drops the most-recently-inserted rows when ordering by that column
  // (likely a connection-pool snapshot issue). Sorting is done client-side instead.
  const { data: players, error: playersError } = await admin
    .from("boussole_players")
    .select("*")
    .eq("room_id", room.id);

  if (playersError) {
    return NextResponse.json({ error: playersError.message }, { status: 500 });
  }

  // Sort by joined_at ascending in JS to avoid the PostgREST ordering bug
  const sorted = (players ?? []).slice().sort(
    (a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime(),
  );

  return NextResponse.json(
    { ...room, players: sorted },
    { headers: { "Cache-Control": "no-store" } },
  );
}
