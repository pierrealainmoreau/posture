import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parsePhase(phase: string): { type: string; idx: number } {
  if (phase.startsWith("voting:")) return { type: "voting", idx: parseInt(phase.split(":")[1] ?? "0", 10) };
  if (phase.startsWith("reveal:")) return { type: "reveal", idx: parseInt(phase.split(":")[1] ?? "0", 10) };
  if (phase === "results") return { type: "results", idx: 0 };
  return { type: "collecting", idx: 0 };
}

// GET — return votes
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();

  const { data: room } = await admin
    .from("tvml_rooms")
    .select("id, phase")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  const phase = room.phase ?? "collecting";
  const { type: phaseType, idx: phaseIdx } = parsePhase(phase);
  const queryPhase = req.nextUrl.searchParams.get("phase");
  const isResults = phaseType === "results" || queryPhase === "results";

  if (isResults) {
    // Return all votes with participant name for score computation
    const [{ data: statements }, { data: votes }] = await Promise.all([
      admin
        .from("tvml_statements")
        .select("id, participant_name, lie_index")
        .eq("room_id", room.id)
        .order("created_at", { ascending: true }),
      admin
        .from("tvml_votes")
        .select("id, statements_id, voter_name, guessed_lie_index")
        .eq("room_id", room.id),
    ]);

    const result = (statements ?? []).map((s) => {
      const stmtVotes = (votes ?? []).filter((v) => v.statements_id === s.id);
      return {
        statements_id: s.id,
        participant_name: s.participant_name,
        lie_index: s.lie_index,
        votes: stmtVotes,
      };
    });

    return NextResponse.json(result);
  }

  // Return votes for current statement only (for vote count display)
  const { data: statements } = await admin
    .from("tvml_statements")
    .select("id")
    .eq("room_id", room.id)
    .order("created_at", { ascending: true });

  const currentStatement = (statements ?? [])[phaseIdx];
  if (!currentStatement) return NextResponse.json([]);

  const { data: votes } = await admin
    .from("tvml_votes")
    .select("id, statements_id, voter_name, guessed_lie_index")
    .eq("statements_id", currentStatement.id);

  return NextResponse.json(votes ?? []);
}

// POST — submit vote (no auth required)
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const body = await req.json();
  const { voterName, statementsId, guessedLieIndex } = body;

  if (!voterName?.trim()) {
    return NextResponse.json({ error: "Le nom du votant est requis" }, { status: 400 });
  }
  if (voterName.trim().length > 64) {
    return NextResponse.json({ error: "Nom trop long (64 caractères max)" }, { status: 400 });
  }
  if (!statementsId) {
    return NextResponse.json({ error: "L'identifiant des déclarations est requis" }, { status: 400 });
  }
  if (![1, 2, 3].includes(guessedLieIndex)) {
    return NextResponse.json({ error: "L'index deviné doit être 1, 2 ou 3" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();

  const { data: room } = await admin
    .from("tvml_rooms")
    .select("id, phase")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (!room.phase?.startsWith("voting:")) {
    return NextResponse.json({ error: "Le vote n'est pas ouvert" }, { status: 410 });
  }

  const { type: phaseType, idx: phaseIdx } = parsePhase(room.phase);
  if (phaseType !== "voting") {
    return NextResponse.json({ error: "Le vote n'est pas ouvert" }, { status: 410 });
  }

  // Get the Nth statement (by created_at order) and validate
  const { data: statements } = await admin
    .from("tvml_statements")
    .select("id, participant_name")
    .eq("room_id", room.id)
    .order("created_at", { ascending: true });

  const currentStatement = (statements ?? [])[phaseIdx];
  if (!currentStatement) {
    return NextResponse.json({ error: "Déclarations introuvables pour cette phase" }, { status: 404 });
  }
  if (currentStatement.id !== statementsId) {
    return NextResponse.json({ error: "Ces déclarations ne correspondent pas à la phase actuelle" }, { status: 400 });
  }
  if (currentStatement.participant_name === voterName.trim()) {
    return NextResponse.json({ error: "Vous ne pouvez pas voter pour vos propres déclarations" }, { status: 400 });
  }

  const { error } = await admin
    .from("tvml_votes")
    .upsert(
      {
        room_id: room.id,
        statements_id: statementsId,
        voter_name: voterName.trim(),
        guessed_lie_index: guessedLieIndex,
      },
      { onConflict: "statements_id,voter_name" },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
