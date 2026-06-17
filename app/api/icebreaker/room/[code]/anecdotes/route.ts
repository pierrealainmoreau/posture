import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper: verify the caller is the room creator
async function getAuthedHost(code: string) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminSupabaseClient();
  const { data: room } = await admin
    .from("icebreaker_rooms")
    .select("id, creator_user_id, is_active")
    .eq("code", code.toUpperCase())
    .single();

  if (!room || room.creator_user_id !== user.id) return null;
  return { admin, user, room };
}

// GET — anecdotes
// • host → all anecdotes (pending + approved) with submitted_by
// • public in "voting"  phase → approved only, no submitted_by
// • public in "results" phase → approved only, with submitted_by
export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } },
) {
  const admin = createAdminSupabaseClient();
  const code  = params.code.toUpperCase();

  // Try host auth first
  const ctx = await getAuthedHost(params.code);
  if (ctx) {
    const { data } = await ctx.admin
      .from("icebreaker_room_anecdotes")
      .select("id, question, is_approved, submitted_by, created_at")
      .eq("room_id", ctx.room.id)
      .order("created_at", { ascending: true });
    return NextResponse.json(data ?? [], {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", "Pragma": "no-cache" },
    });
  }

  // Public fallback — allowed in voting / results phases
  const { data: room } = await admin
    .from("icebreaker_rooms")
    .select("id, phase")
    .eq("code", code)
    .single();

  if (!room) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const phase = room.phase ?? "";
  if (!phase.startsWith("voting:") && !phase.startsWith("reveal:") && phase !== "results") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const showSubmittedBy = phase === "results" || phase.startsWith("reveal:");

  const { data } = await admin
    .from("icebreaker_room_anecdotes")
    .select(showSubmittedBy ? "id, question, submitted_by" : "id, question")
    .eq("room_id", room.id)
    .eq("is_approved", true)
    .order("created_at", { ascending: true });

  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", "Pragma": "no-cache" },
  });
}

// POST — submit anecdote anonymously (no auth required)
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const { question, submitted_by } = await req.json();
  if (!question?.trim()) {
    return NextResponse.json({ error: "La question ne peut pas être vide" }, { status: 400 });
  }
  if (question.trim().length > 500) {
    return NextResponse.json({ error: "Question trop longue (500 caractères max)" }, { status: 400 });
  }
  if (submitted_by && typeof submitted_by === "string" && submitted_by.trim().length > 64) {
    return NextResponse.json({ error: "Nom trop long (64 caractères max)" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: room } = await admin
    .from("icebreaker_rooms")
    .select("id, is_active")
    .eq("code", params.code.toUpperCase())
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (!room.is_active) return NextResponse.json({ error: "Cette session est fermée" }, { status: 410 });

  const { error } = await admin
    .from("icebreaker_room_anecdotes")
    .insert({
      room_id: room.id,
      question: question.trim(),
      submitted_by: submitted_by?.trim() ?? null,
      is_approved: true,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH — approve or reject an anecdote — host only
export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const ctx = await getAuthedHost(params.code);
  if (!ctx) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { anecdote_id, is_approved } = await req.json();
  if (!anecdote_id || typeof is_approved !== "boolean") {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const { error } = await ctx.admin
    .from("icebreaker_room_anecdotes")
    .update({ is_approved })
    .eq("id", anecdote_id)
    .eq("room_id", ctx.room.id);

  return NextResponse.json({ ok: !error });
}

// DELETE — remove an anecdote — host only
export async function DELETE(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const ctx = await getAuthedHost(params.code);
  if (!ctx) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { anecdote_id } = await req.json();
  if (!anecdote_id) return NextResponse.json({ error: "anecdote_id manquant" }, { status: 400 });

  const { error } = await ctx.admin
    .from("icebreaker_room_anecdotes")
    .delete()
    .eq("id", anecdote_id)
    .eq("room_id", ctx.room.id);

  return NextResponse.json({ ok: !error });
}
