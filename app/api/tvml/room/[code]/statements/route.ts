import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parsePhase(phase: string): { type: string; idx: number } {
  if (phase.startsWith("voting:")) return { type: "voting", idx: parseInt(phase.split(":")[1] ?? "0", 10) };
  if (phase.startsWith("reveal:")) return { type: "reveal", idx: parseInt(phase.split(":")[1] ?? "0", 10) };
  if (phase === "results") return { type: "results", idx: 0 };
  return { type: "collecting", idx: 0 };
}

// GET — return statements with lie_index revealed only at appropriate phases
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();

  const { data: room } = await admin
    .from("tvml_rooms")
    .select("id, phase, creator_user_id")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  // Check if host is requesting (full data)
  const isHostRequest = req.nextUrl.searchParams.get("host") === "1";
  if (isHostRequest) {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== room.creator_user_id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    const { data } = await admin
      .from("tvml_statements")
      .select("id, participant_name, statement_1, statement_2, statement_3, lie_index, created_at")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true });
    return NextResponse.json(data ?? []);
  }

  const { data: statements } = await admin
    .from("tvml_statements")
    .select("id, participant_name, statement_1, statement_2, statement_3, lie_index, created_at")
    .eq("room_id", room.id)
    .order("created_at", { ascending: true });

  const rows = statements ?? [];
  const phase = room.phase ?? "collecting";
  const { type: phaseType, idx: phaseIdx } = parsePhase(phase);

  // Determine which statements should have lie_index revealed
  const result = rows.map((s, i) => {
    const revealLie =
      phaseType === "results" ||
      (phaseType === "reveal" && i === phaseIdx);

    if (revealLie) {
      return s;
    }
    // Strip lie_index
    const { lie_index: _omit, ...rest } = s;
    void _omit;
    return rest;
  });

  return NextResponse.json(result);
}

// POST — submit 3 statements (no auth required)
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const body = await req.json();
  const { participantName, statement1, statement2, statement3, lieIndex } = body;

  if (!participantName?.trim()) {
    return NextResponse.json({ error: "Le nom du participant est requis" }, { status: 400 });
  }
  if (!statement1?.trim() || !statement2?.trim() || !statement3?.trim()) {
    return NextResponse.json({ error: "Les 3 déclarations sont requises" }, { status: 400 });
  }
  if (![1, 2, 3].includes(lieIndex)) {
    return NextResponse.json({ error: "L'index du mensonge doit être 1, 2 ou 3" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();

  const { data: room } = await admin
    .from("tvml_rooms")
    .select("id, phase, participants, is_active")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (!room.is_active) return NextResponse.json({ error: "Cette session est fermée" }, { status: 410 });
  if (room.phase !== "collecting") {
    return NextResponse.json({ error: "La phase de soumission est terminée" }, { status: 410 });
  }

  const participants: string[] = Array.isArray(room.participants) ? room.participants : [];
  const trimmedName = participantName.trim();
  if (!participants.includes(trimmedName)) {
    return NextResponse.json({ error: "Ce participant n'est pas enregistré dans la session" }, { status: 400 });
  }

  // Check if participant already submitted
  const { data: existing } = await admin
    .from("tvml_statements")
    .select("id")
    .eq("room_id", room.id)
    .eq("participant_name", trimmedName)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Vous avez déjà soumis vos déclarations" }, { status: 409 });
  }

  const { error } = await admin
    .from("tvml_statements")
    .insert({
      room_id: room.id,
      participant_name: trimmedName,
      statement_1: statement1.trim(),
      statement_2: statement2.trim(),
      statement_3: statement3.trim(),
      lie_index: lieIndex,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
