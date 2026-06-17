import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface LinkPayload {
  session_type: "retrospective" | "kudo_cards" | "abcde";
  room_code: string;
  links: Array<{ player_pseudo: string; collaborator_id: string }>;
}

// GET — lire les liens existants pour une room
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const session_type = searchParams.get("session_type");
    const room_code = searchParams.get("room_code");
    if (!session_type || !room_code) {
      return NextResponse.json({ error: "session_type and room_code required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("session_participant_links")
      .select("player_pseudo, collaborator_id, collaborators(first_name, last_name)")
      .eq("user_id", user.id)
      .eq("session_type", session_type)
      .eq("room_code", room_code.toUpperCase());

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — sauvegarder les liens participant ↔ collaborateur
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as LinkPayload;
    const { session_type, room_code, links } = body;

    if (!session_type || !room_code || !Array.isArray(links)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (links.length === 0) return NextResponse.json({ saved: 0 });

    const rows = links.map(({ player_pseudo, collaborator_id }) => ({
      user_id: user.id,
      session_type,
      room_code: room_code.toUpperCase(),
      player_pseudo,
      collaborator_id,
    }));

    const { error } = await supabase
      .from("session_participant_links")
      .upsert(rows, { onConflict: "user_id,session_type,room_code,player_pseudo" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ saved: rows.length });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
