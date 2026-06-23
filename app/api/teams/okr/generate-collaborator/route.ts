import { NextRequest, NextResponse } from "next/server";
import { MODEL_ID, getAnthropicClient } from "@/lib/anthropic";
import { buildCollaboratorOkrPrompt } from "@/lib/prompts/okr-collaborator";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";
import type { Collaborator, CompanyOkr, CollaboratorOkr } from "@/lib/types";
import { COACH_SENIORITY_LABELS } from "@/lib/types";

function extractJson(raw: string): string {
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end   = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed, count, limit } = await checkRateLimit(user.id, supabase);
  if (!allowed)
    return NextResponse.json(
      { error: "Limite de requêtes atteinte", details: `${count}/${limit} requêtes utilisées.` },
      { status: 429 },
    );

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { collaborator_id } = body as { collaborator_id: string };
  if (!collaborator_id) {
    return NextResponse.json({ error: "collaborator_id requis" }, { status: 400 });
  }

  // Récupère le collaborateur
  const { data: collaborator, error: collabError } = await supabase
    .from("collaborators")
    .select("*")
    .eq("id", collaborator_id)
    .eq("user_id", user.id)
    .single<Collaborator>();

  if (collabError || !collaborator) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }

  // Récupère l'OKR entreprise le plus récent
  const { data: companyOkr, error: okrError } = await supabase
    .from("company_okrs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<CompanyOkr>();

  if (okrError || !companyOkr) {
    return NextResponse.json({ error: "Aucun OKR entreprise défini" }, { status: 400 });
  }

  try {
    const prompt = buildCollaboratorOkrPrompt({
      role: collaborator.role,
      seniority: COACH_SENIORITY_LABELS[collaborator.seniority],
      company_objective: companyOkr.objective,
      company_key_results: companyOkr.key_results,
      period: companyOkr.period,
    });

    const message = await getAnthropicClient().messages.create({
      model: MODEL_ID,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    if (message.stop_reason === "max_tokens") {
      throw new Error("Réponse tronquée. Réessayez.");
    }

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("Réponse vide de l'IA");

    const parsed = JSON.parse(extractJson(textBlock.text)) as {
      objective: string;
      key_results: Array<{ id: string; label: string; target: string; unit: string }>;
      alignment_rationale: string;
    };

    // Upsert dans collaborator_okrs
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
        .update({
          objective: parsed.objective,
          key_results: parsed.key_results,
          alignment_rationale: parsed.alignment_rationale,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single<CollaboratorOkr>();
      if (error) throw new Error(error.message);
      result = data;
    } else {
      const { data, error } = await supabase
        .from("collaborator_okrs")
        .insert({
          collaborator_id,
          company_okr_id: companyOkr.id,
          objective: parsed.objective,
          key_results: parsed.key_results,
          alignment_rationale: parsed.alignment_rationale,
        })
        .select("*")
        .single<CollaboratorOkr>();
      if (error) throw new Error(error.message);
      result = data;
    }

    await recordUsage(user.id, "okr", supabase);
    return NextResponse.json(result);

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[okr/generate-collaborator] error:", msg);
    return NextResponse.json({ error: "Échec de la génération", details: msg }, { status: 502 });
  }
}
