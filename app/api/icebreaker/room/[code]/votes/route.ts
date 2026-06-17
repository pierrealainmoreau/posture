import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST — submit votes (no auth required, voting phase only)
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const { voter_name, votes } = await req.json();

  if (!voter_name?.trim() || !Array.isArray(votes) || votes.length === 0) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const code  = params.code.toUpperCase();

  const { data: room } = await admin
    .from("icebreaker_rooms")
    .select("id, phase")
    .eq("code", code)
    .single();

  if (!room)                                    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (!room.phase?.startsWith("voting:"))       return NextResponse.json({ error: "Le vote n'est pas ouvert" }, { status: 410 });

  // Validate all anecdote_ids belong to this room to prevent cross-room injection
  const { data: validAnecdotes } = await admin
    .from("icebreaker_room_anecdotes")
    .select("id")
    .eq("room_id", room.id)
    .eq("is_approved", true);

  const validIds = new Set((validAnecdotes ?? []).map((a) => a.id));
  const hasInvalid = votes.some((v: { anecdote_id: string }) => !validIds.has(v.anecdote_id));
  if (hasInvalid) {
    return NextResponse.json({ error: "Anecdote invalide" }, { status: 400 });
  }

  const rows = votes.map((v: { anecdote_id: string; guessed_participant: string }) => ({
    room_id:             room.id,
    anecdote_id:         v.anecdote_id,
    voter_name:          voter_name.trim(),
    guessed_participant: v.guessed_participant,
  }));

  const { error } = await admin
    .from("icebreaker_room_votes")
    .upsert(rows, { onConflict: "room_id,anecdote_id,voter_name" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// GET — results
// • host → always accessible
// • public → only in "results" phase
export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } },
) {
  const admin = createAdminSupabaseClient();
  const code  = params.code.toUpperCase();

  const { data: room } = await admin
    .from("icebreaker_rooms")
    .select("id, phase, creator_user_id")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isHost = user?.id === room.creator_user_id;

  if (!isHost && room.phase !== "results") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Fetch approved anecdotes + all votes
  const [{ data: anecdotes }, { data: votes }] = await Promise.all([
    admin
      .from("icebreaker_room_anecdotes")
      .select("id, question, submitted_by")
      .eq("room_id", room.id)
      .eq("is_approved", true)
      .order("created_at", { ascending: true }),
    admin
      .from("icebreaker_room_votes")
      .select("anecdote_id, voter_name, guessed_participant")
      .eq("room_id", room.id),
  ]);

  const results = (anecdotes ?? []).map((a) => {
    const anecdoteVotes = (votes ?? []).filter((v) => v.anecdote_id === a.id);
    return {
      id:            a.id,
      question:      a.question,
      submitted_by:  a.submitted_by,
      votes:         anecdoteVotes,
      correct_count: anecdoteVotes.filter((v) => v.guessed_participant === a.submitted_by).length,
    };
  });

  return NextResponse.json(results, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", "Pragma": "no-cache" },
  });
}
