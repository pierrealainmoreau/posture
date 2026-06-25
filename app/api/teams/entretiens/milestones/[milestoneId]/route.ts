import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OnboardingMilestone } from "@/lib/types";

export async function PUT(
  req: NextRequest,
  { params }: { params: { milestoneId: string } },
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { milestoneId } = params;

    const { data: milestone } = await supabase
      .from("interview_milestones")
      .select("id, interview:interviews(user_id)")
      .eq("id", milestoneId)
      .single();

    type MilestoneWithInterview = { id: string; interview: { user_id: string } | null };
    const ms = milestone as MilestoneWithInterview | null;

    if (!ms || ms.interview?.user_id !== user.id) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const updates = body as Partial<Pick<OnboardingMilestone, "checklist" | "manager_notes" | "is_completed" | "scheduled_date">>;

    const { data: updated, error } = await supabase
      .from("interview_milestones")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", milestoneId)
      .select("*")
      .single<OnboardingMilestone>();

    if (error || !updated) {
      return NextResponse.json({ error: "Erreur de mise à jour", details: error?.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
