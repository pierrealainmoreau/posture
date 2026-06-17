import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

// POST — register participant name (no auth required)
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Le prénom ne peut pas être vide" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const code  = params.code.toUpperCase();

  const { data: room, error: roomErr } = await admin
    .from("icebreaker_rooms")
    .select("id, participants")
    .eq("code", code)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  const existing: string[] = Array.isArray(room.participants) ? room.participants : [];
  const trimmed = name.trim();

  // Only append if not already present.
  // NOTE: no `.not()` guard — it silently fails when `participants` is NULL in DB
  // (PostgreSQL: NOT NULL = NULL which is falsy, so the UPDATE is skipped).
  if (!existing.includes(trimmed)) {
    const { error } = await admin
      .from("icebreaker_rooms")
      .update({ participants: [...existing, trimmed] })
      .eq("id", room.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
