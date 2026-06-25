import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CollabInterview, MidYearInterview } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { collaboratorId: string } },
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { collaboratorId } = params;

    const { data: collaborator } = await supabase
      .from("collaborators")
      .select("id")
      .eq("id", collaboratorId)
      .eq("user_id", user.id)
      .single();

    if (!collaborator) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

    const { data: interviews, error } = await supabase
      .from("interviews")
      .select("*, milestones:interview_milestones(*)")
      .eq("collaborator_id", collaboratorId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const sorted = (interviews ?? []).map((iv) => ({
      ...iv,
      milestones: ((iv.milestones ?? []) as CollabInterview["milestones"]).sort((a, b) => {
        const order = ["j7", "j30", "j90"];
        return order.indexOf(a.milestone_type) - order.indexOf(b.milestone_type);
      }),
    }));

    return NextResponse.json(sorted);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { collaboratorId: string } },
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { collaboratorId } = params;

    const { data: collaborator } = await supabase
      .from("collaborators")
      .select("id")
      .eq("id", collaboratorId)
      .eq("user_id", user.id)
      .single();

    if (!collaborator) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const { type, slot_number } = body as { type: string; slot_number?: number };

    if (type !== "onboarding" && type !== "mid_year") {
      return NextResponse.json({ error: "Type d'entretien non supporté" }, { status: 400 });
    }

    // ── Onboarding ────────────────────────────────────────────────────────
    if (type === "onboarding") {
      const { data: interview, error: interviewError } = await supabase
        .from("interviews")
        .insert({ collaborator_id: collaboratorId, user_id: user.id, type: "onboarding", status: "active", slot_number: slot_number ?? null })
        .select("*")
        .single();

      if (interviewError || !interview) {
        return NextResponse.json({ error: "Erreur de création", details: interviewError?.message }, { status: 500 });
      }

      const milestonesData = [
        { interview_id: interview.id, milestone_type: "j7" },
        { interview_id: interview.id, milestone_type: "j30" },
        { interview_id: interview.id, milestone_type: "j90" },
      ];
      const { data: milestones, error: milestonesError } = await supabase
        .from("interview_milestones").insert(milestonesData).select("*");

      if (milestonesError) {
        await supabase.from("interviews").delete().eq("id", interview.id);
        return NextResponse.json({ error: "Erreur jalons", details: milestonesError.message }, { status: 500 });
      }

      const result: CollabInterview = {
        ...interview,
        milestones: (milestones ?? []).sort((a, b) => {
          const order = ["j7", "j30", "j90"];
          return order.indexOf(a.milestone_type) - order.indexOf(b.milestone_type);
        }),
      };
      return NextResponse.json(result, { status: 201 });
    }

    // ── Mi-année ──────────────────────────────────────────────────────────
    const { year } = body as { type: string; year?: number };
    const interviewYear = year ?? new Date().getFullYear();
    const shareToken = randomBytes(32).toString("hex");

    const { data: interview, error: interviewError } = await supabase
      .from("interviews")
      .insert({
        collaborator_id: collaboratorId,
        user_id: user.id,
        type: "mid_year",
        status: "draft",
        year: interviewYear,
        share_token: shareToken,
        slot_number: slot_number ?? null,
      })
      .select("*")
      .single();

    if (interviewError || !interview) {
      return NextResponse.json({ error: "Erreur de création", details: interviewError?.message }, { status: 500 });
    }

    const result: MidYearInterview = {
      ...interview,
      collab_past: null,
      collab_present: null,
      collab_future: null,
    };
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
