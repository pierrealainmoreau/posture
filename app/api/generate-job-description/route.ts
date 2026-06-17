import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, MODEL_ID } from "@/lib/anthropic";
import { buildJobDescriptionSystemPrompt } from "@/lib/prompts/job-description-system";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";
import type { JobDescriptionRequest, ContractType, SeniorityLevel } from "@/lib/types";

const MAX_TOKENS = 1200;
const VALID_CONTRACT: ContractType[] = ["cdi", "cdd", "stage", "alternance", "freelance"];
const VALID_SENIORITY: SeniorityLevel[] = ["1-3", "4-5", "6-8", "8-10", "10+"];

function extractJson(raw: string): string {
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

function validate(body: unknown): JobDescriptionRequest | { error: string } {
  if (!body || typeof body !== "object") return { error: "Corps de requête invalide" };
  const b = body as Record<string, unknown>;

  if (typeof b.jobTitle !== "string" || b.jobTitle.trim().length < 2)
    return { error: "Intitulé du poste trop court" };
  if (!VALID_CONTRACT.includes(b.contractType as ContractType))
    return { error: "Type de contrat invalide" };
  if (!VALID_SENIORITY.includes(b.seniority as SeniorityLevel))
    return { error: "Niveau d'expérience invalide" };
  if (typeof b.keyMissions !== "string" || b.keyMissions.trim().length < 10)
    return { error: "Missions trop courtes" };

  return {
    mode: "job-description",
    jobTitle: (b.jobTitle as string).trim(),
    contractType: b.contractType as ContractType,
    seniority: b.seniority as SeniorityLevel,
    department: typeof b.department === "string" ? b.department.trim() || undefined : undefined,
    teamContext: typeof b.teamContext === "string" ? b.teamContext.trim() || undefined : undefined,
    keyMissions: (b.keyMissions as string).trim(),
    technicalSkills: typeof b.technicalSkills === "string" ? b.technicalSkills.trim() || undefined : undefined,
    softSkills: typeof b.softSkills === "string" ? b.softSkills.trim() || undefined : undefined,
    perks: typeof b.perks === "string" ? b.perks.trim() || undefined : undefined,
  };
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
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const validated = validate(body);
  if ("error" in validated) return NextResponse.json(validated, { status: 400 });

  const systemPrompt = buildJobDescriptionSystemPrompt(validated);

  try {
    const message = await getAnthropicClient().messages.create({
      model: MODEL_ID,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: "Génère la fiche de poste." }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text")
      return NextResponse.json({ error: "Réponse vide de l'IA" }, { status: 502 });

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(textBlock.text));
    } catch (e) {
      return NextResponse.json(
        { error: "Réponse mal formatée", details: e instanceof Error ? e.message : String(e) },
        { status: 502 },
      );
    }

    await recordUsage(user.id, "job-description", supabase);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json(
      { error: "Échec de l'appel à l'IA", details: e instanceof Error ? e.message : "Erreur inconnue" },
      { status: 502 },
    );
  }
}
