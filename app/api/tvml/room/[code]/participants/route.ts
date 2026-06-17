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
  const code = params.code.toUpperCase();

  const { data: room, error: roomErr } = await admin
    .from("tvml_rooms")
    .select("id, participants, is_active")
    .eq("code", code)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }
  if (!room.is_active) {
    return NextResponse.json({ error: "Cette session est fermée" }, { status: 410 });
  }

  const existing: string[] = Array.isArray(room.participants) ? room.participants : [];
  const trimmed = name.trim();

  // Only update if not already present (simple check — race conditions are
  // acceptable in a casual game context; the buggy `.not("participants","cs",…)`
  // guard was skipping the update when `participants` was NULL in the DB).
  if (!existing.includes(trimmed)) {
    const { error } = await admin
      .from("tvml_rooms")
      .update({ participants: [...existing, trimmed] })
      .eq("id", room.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
