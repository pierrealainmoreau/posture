import { NextRequest, NextResponse } from "next/server";
import { MAX_TOKENS_COACH, MODEL_ID, getAnthropicClient } from "@/lib/anthropic";
import { buildWeeklySessionPrompt } from "@/lib/prompts/weekly-session-system";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";
import type { Collaborator, ManagerialPlan, WeeklySession, COACH_CONFIG } from "@/lib/types";

const FREE_WEEKS_LIMIT = 4;

function extractJson(raw: string): string {
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

interface RawSessionResponse {
  priority_topic_1: string;
  priority_topic_2: string;
  exploration_topic: string;
  unexpected_question: string;
  development_axis: string;
  priority_topic_1_rationale: string;
  priority_topic_2_rationale: string;
  exploration_rationale: string;
  suggested_follow_ups: string[];
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed, count, limit } = await checkRateLimit(user.id, supabase);
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite de requêtes atteinte", details: `${count}/${limit} requêtes utilisées.` },
      { status: 429 },
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const collaboratorId = b.collaborator_id;
  const weekNumber = b.week_number;

  if (typeof collaboratorId !== "string" || !collaboratorId.match(/^[0-9a-f-]{36}$/i)) {
    return NextResponse.json({ error: "collaborator_id invalide" }, { status: 400 });
  }
  if (typeof weekNumber !== "number" || !Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 12) {
    return NextResponse.json({ error: "week_number doit être un entier entre 1 et 12" }, { status: 400 });
  }

  // Fetch collaborator
  const { data: collaborator, error: collabError } = await supabase
    .from("collaborators")
    .select("*")
    .eq("id", collaboratorId)
    .eq("user_id", user.id)
    .single<Collaborator>();

  if (collabError || !collaborator) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }

  // Paywall check
  if (weekNumber > FREE_WEEKS_LIMIT && !collaborator.is_premium) {
    return NextResponse.json({ error: "premium_required" }, { status: 402 });
  }

  // Fetch managerial plan
  const { data: plan } = await supabase
    .from("managerial_plans")
    .select("*")
    .eq("collaborator_id", collaboratorId)
    .single<ManagerialPlan>();

  if (!plan) {
    return NextResponse.json({ error: "Générez d'abord le plan managérial" }, { status: 400 });
  }

  // Fetch previous sessions to build context
  const { data: previousSessions } = await supabase
    .from("weekly_sessions")
    .select("week_number, development_axis, manager_notes")
    .eq("collaborator_id", collaboratorId)
    .order("week_number", { ascending: true });

  const previous_axes_used = (previousSessions ?? [])
    .filter((s) => s.week_number !== weekNumber)
    .map((s) => s.development_axis as string)
    .filter(Boolean);

  const recentNotes = (previousSessions ?? [])
    .filter((s) => s.week_number < weekNumber && s.manager_notes)
    .slice(-3)
    .map((s) => `Semaine ${s.week_number}: ${s.manager_notes}`)
    .join("\n");

  const systemPrompt = buildWeeklySessionPrompt({
    week_number: weekNumber,
    role: collaborator.role,
    seniority: collaborator.seniority,
    period: collaborator.period ?? "development",
    relationship_started_at: collaborator.relationship_started_at,
    current_ops_topics: collaborator.current_ops_topics,
    development_axes: plan.detected_development_axes,
    previous_axes_used,
    recent_manager_notes: recentNotes || null,
  });

  let parsed: RawSessionResponse;
  try {
    const message = await getAnthropicClient().messages.create({
      model: MODEL_ID,
      max_tokens: MAX_TOKENS_COACH,
      system: systemPrompt,
      messages: [{ role: "user", content: `Génère la fiche de la semaine ${weekNumber}.` }],
    });

    if (message.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "Réponse tronquée par le modèle. Réessayez, ou réduisez le contexte (sujets opérationnels)." },
        { status: 502 },
      );
    }
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Réponse vide de l'IA" }, { status: 502 });
    }

    parsed = JSON.parse(extractJson(textBlock.text)) as RawSessionResponse;
  } catch (e) {
    return NextResponse.json(
      { error: "Échec de la génération", details: e instanceof Error ? e.message : "Erreur inconnue" },
      { status: 502 },
    );
  }

  // Upsert session
  const { data: session, error: upsertError } = await supabase
    .from("weekly_sessions")
    .upsert({
      collaborator_id: collaboratorId,
      week_number: weekNumber,
      priority_topic_1: parsed.priority_topic_1,
      priority_topic_2: parsed.priority_topic_2,
      exploration_topic: parsed.exploration_topic,
      unexpected_question: parsed.unexpected_question,
      development_axis: parsed.development_axis,
      raw_content: {
        priority_topic_1_rationale: parsed.priority_topic_1_rationale,
        priority_topic_2_rationale: parsed.priority_topic_2_rationale,
        exploration_rationale: parsed.exploration_rationale,
        suggested_follow_ups: parsed.suggested_follow_ups,
      },
      updated_at: new Date().toISOString(),
    }, { onConflict: "collaborator_id,week_number" })
    .select("*")
    .single<WeeklySession>();

  if (upsertError || !session) {
    return NextResponse.json({ error: "Erreur de sauvegarde", details: upsertError?.message }, { status: 500 });
  }

  await recordUsage(user.id, "teams", supabase);
  return NextResponse.json(session);
}
