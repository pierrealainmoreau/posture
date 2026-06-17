import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

// GET — list all rooms for the current host with statement + participant counts
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  const { data: rooms } = await admin
    .from("tvml_rooms")
    .select("id, code, is_active, created_at, phase, participants")
    .eq("creator_user_id", user.id)
    .order("created_at", { ascending: false });

  if (!rooms) return NextResponse.json([]);

  // Fetch statement counts per room
  const { data: statements } = await admin
    .from("tvml_statements")
    .select("room_id")
    .in("room_id", rooms.map((r) => r.id));

  const result = rooms.map((r) => {
    const roomStatements = (statements ?? []).filter((s) => s.room_id === r.id);
    return {
      ...r,
      participant_count: Array.isArray(r.participants) ? r.participants.length : 0,
      submitted_count: roomStatements.length,
    };
  });

  return NextResponse.json(result);
}

function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// POST — create a new room (auth required)
export async function POST() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  for (let i = 0; i < 5; i++) {
    const code = generateCode();
    const { data, error } = await admin
      .from("tvml_rooms")
      .insert({ code, creator_user_id: user.id })
      .select("id, code")
      .single();

    if (!error && data) {
      await admin.from("usage").insert({ user_id: user.id, tool: "tvml" });
      return NextResponse.json(data);
    }
    if (error && !error.message.includes("unique")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Impossible de créer la session" }, { status: 500 });
}
