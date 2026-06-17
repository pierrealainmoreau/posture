import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

// POST — save approved anecdotes to the host's user_anecdotes pool, then let the
// client redirect to /icebreaker where they'll be included in the draw.
export async function POST(
  _req: NextRequest,
  { params }: { params: { code: string } },
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: room } = await admin
    .from("icebreaker_rooms")
    .select("id, creator_user_id")
    .eq("code", params.code.toUpperCase())
    .single();

  if (!room || room.creator_user_id !== user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { data: approved } = await admin
    .from("icebreaker_room_anecdotes")
    .select("question")
    .eq("room_id", room.id)
    .eq("is_approved", true);

  if (!approved || approved.length === 0) {
    return NextResponse.json({ error: "Aucune anecdote approuvée à lancer" }, { status: 400 });
  }

  // Bulk insert into the host's personal anecdotes pool
  const { error } = await admin
    .from("user_anecdotes")
    .insert(approved.map((a) => ({ user_id: user.id, question: a.question })));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // launched_at is set by PATCH /room/[code] when phase → voting; skip it here
  // to avoid starting the auto-close countdown before voting actually begins.

  return NextResponse.json({ ok: true, count: approved.length });
}
