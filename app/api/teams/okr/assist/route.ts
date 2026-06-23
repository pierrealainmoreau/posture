import { NextRequest, NextResponse } from "next/server";
import { MODEL_ID, getAnthropicClient } from "@/lib/anthropic";
import { buildOkrAssistPrompt, type OkrAssistStep } from "@/lib/prompts/okr-assist";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";
import type { KeyResult } from "@/lib/types";

function extractJson(raw: string): string {
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const arrStart = cleaned.indexOf("[");
  const arrEnd   = cleaned.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) return cleaned.slice(arrStart, arrEnd + 1);
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

  const b = body as Record<string, unknown>;
  const step = b.step as OkrAssistStep;
  const validSteps: OkrAssistStep[] = ["improve_objective", "suggest_key_results", "critique"];
  if (!validSteps.includes(step)) {
    return NextResponse.json({ error: "Étape invalide" }, { status: 400 });
  }

  const period            = (b.period as string) ?? "";
  const current_objective = (b.current_objective as string) ?? "";
  const current_key_results = (b.current_key_results as KeyResult[]) ?? [];

  if (!period.trim()) return NextResponse.json({ error: "period requis" }, { status: 400 });
  if (!current_objective.trim() && step !== "suggest_key_results") {
    return NextResponse.json({ error: "current_objective requis" }, { status: 400 });
  }

  try {
    const { system, user: userMsg, maxTokens } = buildOkrAssistPrompt({
      step,
      period,
      current_objective,
      current_key_results,
    });

    const message = await getAnthropicClient().messages.create({
      model: MODEL_ID,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMsg }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("Réponse vide de l'IA");
    const raw = textBlock.text.trim();

    await recordUsage(user.id, "okr", supabase);

    if (step === "improve_objective") {
      return NextResponse.json({ suggestion: raw });
    }

    if (step === "suggest_key_results") {
      const krs = JSON.parse(extractJson(raw)) as KeyResult[];
      return NextResponse.json({ suggestion: krs });
    }

    // critique — texte libre
    return NextResponse.json({ suggestion: raw });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[okr/assist] error:", msg);
    return NextResponse.json({ error: "Échec de l'assistance IA", details: msg }, { status: 502 });
  }
}
