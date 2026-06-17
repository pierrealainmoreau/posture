import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CollaboratorManual } from "@/lib/types";

// GET — Récupère le manuel du collaborateur (authentifié)
export async function GET(
  _req: NextRequest,
  { params }: { params: { collaboratorId: string } },
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase
    .from("collaborator_manuals")
    .select("*")
    .eq("collaborator_id", params.collaboratorId)
    .eq("user_id", user.id)
    .maybeSingle<CollaboratorManual>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? null);
}

// POST — Crée le manuel (génère le token) ou renvoie l'existant (authentifié)
export async function POST(
  _req: NextRequest,
  { params }: { params: { collaboratorId: string } },
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Vérifie que le collaborateur appartient à l'utilisateur
  const { data: collab } = await supabase
    .from("collaborators")
    .select("id")
    .eq("id", params.collaboratorId)
    .eq("user_id", user.id)
    .single<{ id: string }>();

  if (!collab) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

  // Vérifie si un manuel existe déjà
  const { data: existing } = await supabase
    .from("collaborator_manuals")
    .select("*")
    .eq("collaborator_id", params.collaboratorId)
    .eq("user_id", user.id)
    .maybeSingle<CollaboratorManual>();

  if (existing) return NextResponse.json(existing);

  // Crée un nouveau manuel avec un token cryptographiquement sûr
  const token = randomBytes(32).toString("hex");
  const { data, error } = await supabase
    .from("collaborator_manuals")
    .insert({ collaborator_id: params.collaboratorId, user_id: user.id, token })
    .select("*")
    .single<CollaboratorManual>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PUT — Le manager met à jour les réponses directement (authentifié)
export async function PUT(
  req: NextRequest,
  { params }: { params: { collaboratorId: string } },
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const { answers } = body as { answers: Record<string, string> };
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "answers requis" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("collaborator_manuals")
    .select("id, completed_at")
    .eq("collaborator_id", params.collaboratorId)
    .eq("user_id", user.id)
    .maybeSingle<Pick<CollaboratorManual, "id" | "completed_at">>();

  if (!existing) return NextResponse.json({ error: "Manuel introuvable" }, { status: 404 });

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("collaborator_manuals")
    .update({
      answers,
      completed_at: existing.completed_at ?? now,
      updated_at: now,
    })
    .eq("id", existing.id)
    .select("*")
    .single<CollaboratorManual>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
