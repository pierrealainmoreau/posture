import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CollaboratorOkr, KeyResult } from "@/lib/types";

// GET — Récupère le(s) OKR collaborateur(s)
// ?collaborator_id=xxx  → OKR d'un collaborateur spécifique (pour le company_okr le plus récent)
// ?company_okr_id=xxx   → Tous les OKRs collaborateurs pour un OKR entreprise
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const collaboratorId = searchParams.get("collaborator_id");
  const companyOkrId   = searchParams.get("company_okr_id");

  if (collaboratorId) {
    // Récupère le company OKR le plus récent pour avoir le company_okr_id
    const { data: companyOkr } = await supabase
      .from("company_okrs")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (!companyOkr) return NextResponse.json(null);

    const { data, error } = await supabase
      .from("collaborator_okrs")
      .select("*")
      .eq("collaborator_id", collaboratorId)
      .eq("company_okr_id", companyOkr.id)
      .maybeSingle<CollaboratorOkr>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? null);
  }

  if (companyOkrId) {
    // Tous les OKRs collaborateurs pour cet OKR entreprise (sécurisé via RLS)
    const { data, error } = await supabase
      .from("collaborator_okrs")
      .select("*")
      .eq("company_okr_id", companyOkrId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  return NextResponse.json({ error: "collaborator_id ou company_okr_id requis" }, { status: 400 });
}

// POST — Crée ou met à jour l'OKR d'un collaborateur
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const { collaborator_id, objective, key_results } = b as {
    collaborator_id: string;
    objective: string;
    key_results: KeyResult[];
  };

  if (!collaborator_id || !objective?.trim()) {
    return NextResponse.json({ error: "collaborator_id et objective sont requis" }, { status: 400 });
  }
  if (!Array.isArray(key_results) || key_results.length === 0) {
    return NextResponse.json({ error: "Au moins un Key Result est requis" }, { status: 400 });
  }

  // Vérifie que le collaborateur appartient à l'utilisateur
  const { data: collab } = await supabase
    .from("collaborators")
    .select("id")
    .eq("id", collaborator_id)
    .eq("user_id", user.id)
    .single<{ id: string }>();

  if (!collab) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

  // Récupère le company OKR le plus récent
  const { data: companyOkr } = await supabase
    .from("company_okrs")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!companyOkr) {
    return NextResponse.json({ error: "Aucun OKR entreprise défini" }, { status: 400 });
  }

  // Upsert
  const { data: existing } = await supabase
    .from("collaborator_okrs")
    .select("id")
    .eq("collaborator_id", collaborator_id)
    .eq("company_okr_id", companyOkr.id)
    .maybeSingle<{ id: string }>();

  let result: CollaboratorOkr | null = null;

  if (existing) {
    const { data, error } = await supabase
      .from("collaborator_okrs")
      .update({ objective: objective.trim(), key_results, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("*")
      .single<CollaboratorOkr>();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  } else {
    const { data, error } = await supabase
      .from("collaborator_okrs")
      .insert({
        collaborator_id,
        company_okr_id: companyOkr.id,
        objective: objective.trim(),
        key_results,
      })
      .select("*")
      .single<CollaboratorOkr>();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  }

  return NextResponse.json(result);
}
