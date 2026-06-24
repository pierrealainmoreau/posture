import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { CareerSelfAssessment, CareerSelfLevels, CareerPath } from "@/lib/types";

interface CareerFillContext {
  id: string;
  self_levels: CareerSelfLevels;
  completed_at: string | null;
  collaborator_first_name: string;
  collaborator_last_name: string;
  career_path: CareerPath | null;
}

// GET — Récupère l'auto-évaluation carrière par token (public, service role)
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: assessment } = await supabase
      .from("career_self_assessments")
      .select("id, self_levels, completed_at, collaborator_id")
      .eq("token", params.token)
      .maybeSingle<Pick<CareerSelfAssessment, "id" | "self_levels" | "completed_at" | "collaborator_id">>();

    if (!assessment) return NextResponse.json({ error: "Lien introuvable ou expiré" }, { status: 404 });

    const { data: collab } = await supabase
      .from("collaborators")
      .select("first_name, last_name")
      .eq("id", assessment.collaborator_id)
      .single<{ first_name: string; last_name: string }>();

    // Récupère le career path depuis le plan managérial
    const { data: plan } = await supabase
      .from("managerial_plans")
      .select("raw_content")
      .eq("collaborator_id", assessment.collaborator_id)
      .maybeSingle<{ raw_content: { career_path?: CareerPath } }>();

    const result: CareerFillContext = {
      id: assessment.id,
      self_levels: (assessment.self_levels as CareerSelfLevels) ?? {},
      completed_at: assessment.completed_at,
      collaborator_first_name: collab?.first_name ?? "",
      collaborator_last_name: collab?.last_name ?? "",
      career_path: plan?.raw_content?.career_path ?? null,
    };

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// PUT — Soumet l'auto-évaluation (public, service role)
export async function PUT(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const supabase = createAdminSupabaseClient();

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const { self_levels } = body as { self_levels: CareerSelfLevels };
    if (!self_levels || typeof self_levels !== "object") {
      return NextResponse.json({ error: "self_levels requis" }, { status: 400 });
    }

    const { data: assessment } = await supabase
      .from("career_self_assessments")
      .select("id, completed_at")
      .eq("token", params.token)
      .maybeSingle<Pick<CareerSelfAssessment, "id" | "completed_at">>();

    if (!assessment) return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("career_self_assessments")
      .update({
        self_levels,
        completed_at: assessment.completed_at ?? now,
        updated_at: now,
      })
      .eq("id", assessment.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
