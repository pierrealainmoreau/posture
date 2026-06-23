import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { CollaboratorManual, ManualAnswers } from "@/lib/types";

interface ManualWithContext {
  id: string;
  answers: ManualAnswers;
  completed_at: string | null;
  collaborator_first_name: string;
  collaborator_last_name: string;
}

// GET — Récupère le manuel par token (public, service role)
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const supabase = createAdminSupabaseClient();

  const { data: manual, error } = await supabase
    .from("collaborator_manuals")
    .select("id, answers, completed_at, collaborator_id")
    .eq("token", params.token)
    .maybeSingle<Pick<CollaboratorManual, "id" | "answers" | "completed_at" | "collaborator_id">>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!manual) return NextResponse.json({ error: "Lien introuvable ou expiré" }, { status: 404 });

  // Récupère le prénom/nom du collaborateur
  const { data: collab } = await supabase
    .from("collaborators")
    .select("first_name, last_name")
    .eq("id", manual.collaborator_id)
    .single<{ first_name: string; last_name: string }>();

  const result: ManualWithContext = {
    id: manual.id,
    answers: (manual.answers as ManualAnswers) ?? {},
    completed_at: manual.completed_at,
    collaborator_first_name: collab?.first_name ?? "",
    collaborator_last_name: collab?.last_name ?? "",
  };

  return NextResponse.json(result);
}

// PUT — Soumet les réponses (public, service role)
export async function PUT(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const supabase = createAdminSupabaseClient();

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { answers } = body as { answers: ManualAnswers };
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "answers requis" }, { status: 400 });
  }

  // Récupère le manuel par token
  const { data: manual } = await supabase
    .from("collaborator_manuals")
    .select("id, completed_at")
    .eq("token", params.token)
    .maybeSingle<Pick<CollaboratorManual, "id" | "completed_at">>();

  if (!manual) return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("collaborator_manuals")
    .update({
      answers,
      completed_at: manual.completed_at ?? now, // garde la date de 1ère soumission
      updated_at: now,
    })
    .eq("id", manual.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
