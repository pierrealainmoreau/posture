import { NextRequest, NextResponse } from "next/server";

import { MAX_TOKENS_FEEDBACK, MODEL_ID, getAnthropicClient } from "@/lib/anthropic";
import { buildInterviewSystemPrompt } from "@/lib/prompts/interview-system";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";
import type { InterviewRequest, InterviewResponse, InterviewType } from "@/lib/types";

const VALID_TYPES: InterviewType[] = [
  "recruitment",
  "performance_review",
  "1on1",
  "career_development",
  "offboarding",
];

const MIN_CONTEXT_LENGTH = 20;
const MAX_CONTEXT_LENGTH = 3000;
const MAX_TOKENS_INTERVIEW = 4000;

interface ApiError {
  error: string;
  details?: string;
}

function validate(body: unknown): InterviewRequest | ApiError {
  if (!body || typeof body !== "object") return { error: "Corps de requête invalide" };
  const b = body as Record<string, unknown>;

  if (!VALID_TYPES.includes(b.type as InterviewType)) return { error: "Type d'entretien invalide" };
  if (typeof b.context !== "string") return { error: "Le champ 'context' doit être une chaîne de caractères" };
  if (b.context.trim().length < MIN_CONTEXT_LENGTH) return { error: "Contexte trop court", details: `Minimum ${MIN_CONTEXT_LENGTH} caractères.` };
  if (b.context.length > MAX_CONTEXT_LENGTH) return { error: "Contexte trop long", details: `Limite : ${MAX_CONTEXT_LENGTH} caractères.` };

  return {
    type: b.type as InterviewType,
    context: b.context.trim(),
    candidateName: typeof b.candidateName === "string" && b.candidateName.trim() ? b.candidateName.trim() : undefined,
  };
}

function isApiError(v: InterviewRequest | ApiError): v is ApiError {
  return "error" in v;
}

function extractJson(raw: string): string {
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed, count, limit } = await checkRateLimit(user.id, supabase);
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite de requêtes atteinte", details: `Vous avez utilisé ${count}/${limit} requêtes disponibles.` },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const validated = validate(body);
  if (isApiError(validated)) return NextResponse.json(validated, { status: 400 });

  const systemPrompt = buildInterviewSystemPrompt({ type: validated.type, context: validated.context, candidateName: validated.candidateName });

  try {
    const message = await getAnthropicClient().messages.create({
      model: MODEL_ID,
      max_tokens: MAX_TOKENS_INTERVIEW,
      system: systemPrompt,
      messages: [{ role: "user", content: "Génère le guide d'entretien pour le contexte fourni." }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return NextResponse.json({ error: "Réponse vide de l'IA" }, { status: 502 });

    let parsed: InterviewResponse;
    try {
      parsed = JSON.parse(extractJson(textBlock.text)) as InterviewResponse;
    } catch (e) {
      return NextResponse.json({ error: "Réponse mal formatée", details: e instanceof Error ? e.message : String(e) }, { status: 502 });
    }

    await recordUsage(user.id, "interview", supabase);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: "Échec de l'appel à l'IA", details: e instanceof Error ? e.message : "Erreur inconnue" }, { status: 502 });
  }
}
