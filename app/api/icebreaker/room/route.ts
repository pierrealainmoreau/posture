import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { recordUsage } from "@/lib/supabase/rateLimit";

// GET — list all rooms for the current user with anecdote counts
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  const { data: rooms } = await admin
    .from("icebreaker_rooms")
    .select("id, code, is_active, created_at")
    .eq("creator_user_id", user.id)
    .order("created_at", { ascending: false });

  if (!rooms) return NextResponse.json([]);

  // Fetch anecdote counts per room
  const { data: counts } = await admin
    .from("icebreaker_room_anecdotes")
    .select("room_id, is_approved, submitted_by")
    .in("room_id", rooms.map((r) => r.id));

  const result = rooms.map((r) => {
    const roomCounts = (counts ?? []).filter((c) => c.room_id === r.id);
    const uniquePlayers = new Set(
      roomCounts.map((c) => c.submitted_by).filter(Boolean)
    ).size;
    return {
      ...r,
      pending_count:  roomCounts.filter((c) => !c.is_approved).length,
      approved_count: roomCounts.filter((c) =>  c.is_approved).length,
      total_count:    roomCounts.length,
      player_count:   uniquePlayers,
    };
  });

  return NextResponse.json(result);
}

function generateCode(): string {
  // Unambiguous chars: no 0/O, 1/I/L
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // game_type distinguishes "icebreaker" from "anecdotes" sessions
  const body = await req.json().catch(() => ({})) as { game_type?: string };
  const gameType = body.game_type === "anecdotes" ? "anecdotes" : "icebreaker";

  // Try up to 5 times to get a unique code
  for (let i = 0; i < 5; i++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from("icebreaker_rooms")
      .insert({ code, creator_user_id: user.id, game_type: gameType })
      .select("id, code")
      .single();

    if (!error && data) {
      await recordUsage(user.id, "icebreaker", supabase);
      return NextResponse.json(data);
    }
    // If not a uniqueness conflict, bail out immediately
    if (error && !error.message.includes("unique")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Impossible de créer la session" }, { status: 500 });
}
