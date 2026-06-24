import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CareerSelfAssessment } from "@/lib/types";

// GET — Récupère l'auto-évaluation carrière du collaborateur (authentifié)
export async function GET(
  _req: NextRequest,
  { params }: { params: { collaboratorId: string } },
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data, error } = await supabase
      .from("career_self_assessments")
      .select("*")
      .eq("collaborator_id", params.collaboratorId)
      .eq("user_id", user.id)
      .maybeSingle<CareerSelfAssessment>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? null);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST — Crée l'auto-évaluation carrière (génère le token) ou renvoie l'existante
export async function POST(
  _req: NextRequest,
  { params }: { params: { collaboratorId: string } },
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: collab } = await supabase
      .from("collaborators")
      .select("id")
      .eq("id", params.collaboratorId)
      .eq("user_id", user.id)
      .single<{ id: string }>();

    if (!collab) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

    const { data: existing } = await supabase
      .from("career_self_assessments")
      .select("*")
      .eq("collaborator_id", params.collaboratorId)
      .eq("user_id", user.id)
      .maybeSingle<CareerSelfAssessment>();

    if (existing) return NextResponse.json(existing);

    const token = randomBytes(32).toString("hex");
    const { data, error } = await supabase
      .from("career_self_assessments")
      .insert({ collaborator_id: params.collaboratorId, user_id: user.id, token, self_levels: {} })
      .select("*")
      .single<CareerSelfAssessment>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
