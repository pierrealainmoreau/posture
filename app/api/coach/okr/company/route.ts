import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CompanyOkr, KeyResult } from "@/lib/types";

// GET — Récupère l'OKR entreprise le plus récent de l'utilisateur
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase
    .from("company_okrs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<CompanyOkr>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? null);
}

// POST — Crée ou met à jour l'OKR entreprise (upsert sur user_id + period)
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const { period, objective, key_results } = b as {
    period: string;
    objective: string;
    key_results: KeyResult[];
  };

  if (!period?.trim() || !objective?.trim()) {
    return NextResponse.json({ error: "period et objective sont requis" }, { status: 400 });
  }
  if (!Array.isArray(key_results) || key_results.length === 0) {
    return NextResponse.json({ error: "Au moins un Key Result est requis" }, { status: 400 });
  }

  // Cherche un OKR existant pour cette période
  const { data: existing } = await supabase
    .from("company_okrs")
    .select("id")
    .eq("user_id", user.id)
    .eq("period", period.trim())
    .maybeSingle<{ id: string }>();

  let result: CompanyOkr | null = null;

  if (existing) {
    // Update
    const { data, error } = await supabase
      .from("company_okrs")
      .update({ objective: objective.trim(), key_results, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("*")
      .single<CompanyOkr>();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  } else {
    // Insert
    const { data, error } = await supabase
      .from("company_okrs")
      .insert({ user_id: user.id, period: period.trim(), objective: objective.trim(), key_results })
      .select("*")
      .single<CompanyOkr>();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  }

  return NextResponse.json(result);
}
