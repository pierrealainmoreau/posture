import { NextRequest, NextResponse } from "next/server";

import { MAX_TOKENS_FEEDBACK, MODEL_ID, getAnthropicClient } from "@/lib/anthropic";
import { markWeeklyCoachComplete } from "@/lib/weeklyCoach";
import { buildFeedbackSystemPrompt } from "@/lib/prompts/feedback-system";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";
import type { FeedbackFormat, FeedbackRequest, FeedbackResponse, FeedbackTone, FeedbackType } from "@/lib/types";

const VALID_TYPES: FeedbackType[] = ["positive", "corrective", "mixed"];
const VALID_TONES: FeedbackTone[] = ["caring", "direct", "coaching"];
const VALID_FORMATS: FeedbackFormat[] = ["oral_1on1", "written_slack", "written_email"];

const MIN_CONTEXT_LENGTH = 20;
const MAX_CONTEXT_LENGTH = 2000;

interface ApiError {
  error: string;
  details?: string;
}

function validate(body: unknown): FeedbackRequest | ApiError {
  if (!body || typeof body !== "object") return { error: "Corps de requête invalide" };
  const b = body as Record<string, unknown>;

  if (typeof b.context !== "string") return { error: "Le champ 'context' doit être une chaîne de caractères" };
  if (b.context.trim().length < MIN_CONTEXT_LENGTH) return { error: "Contexte trop court", details: `Minimum ${MIN_CONTEXT_LENGTH} caractères.` };
  if (b.context.length > MAX_CONTEXT_LENGTH) return { error: "Contexte trop long", details: `Limite : ${MAX_CONTEXT_LENGTH} caractères.` };
  if (!VALID_TYPES.includes(b.type as FeedbackType)) return { error: "Type de feedback invalide" };
  if (!VALID_TONES.includes(b.tone as FeedbackTone)) return { error: "Tonalité invalide" };
  if (!VALID_FORMATS.includes(b.format as FeedbackFormat)) return { error: "Format invalide" };

  return {
    context: b.context.trim(),
    type: b.type as FeedbackType,
    tone: b.tone as FeedbackTone,
    format: b.format as FeedbackFormat,
  };
}

function isApiError(value: FeedbackRequest | ApiError): value is ApiError {
  return "error" in value;
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

  const systemPrompt = buildFeedbackSystemPrompt({ type: validated.type, tone: validated.tone, format: validated.format });

  try {
    const message = await getAnthropicClient().messages.create({
      model: MODEL_ID,
      max_tokens: MAX_TOKENS_FEEDBACK,
      system: systemPrompt,
      messages: [{ role: "user", content: `Voici la situation que je veux transformer en feedback :\n\n${validated.context}` }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return NextResponse.json({ error: "Réponse vide de l'IA" }, { status: 502 });

    let parsed: FeedbackResponse;
    try {
      parsed = JSON.parse(extractJson(textBlock.text)) as FeedbackResponse;
    } catch (e) {
      return NextResponse.json({ error: "Réponse mal formatée", details: e instanceof Error ? e.message : String(e), raw: textBlock.text.slice(0, 500) }, { status: 502 });
    }

    await recordUsage(user.id, "feedback", supabase);
    await markWeeklyCoachComplete(user.id, "feedback");
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: "Échec de l'appel à l'IA", details: e instanceof Error ? e.message : "Erreur inconnue" }, { status: 502 });
  }
}
