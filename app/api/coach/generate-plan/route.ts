import { NextRequest, NextResponse } from "next/server";
import { MODEL_ID, getAnthropicClient } from "@/lib/anthropic";

// Each individual Claude call should comfortably fit in Vercel Hobby's 10s limit.
// The client calls this route 4 times sequentially (step=1..4) instead of once.
import {
  buildStep1AxesPrompt,
  buildStep2CadencePrompt,
  buildStep3QuestionsPrompt,
  buildStep4CareerPathPrompt,
} from "@/lib/prompts/managerial-plan-system";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";
import type { Collaborator, DevelopmentAxis, ManagerialPlan } from "@/lib/types";

// ── Helpers ────────────────────────────────────────────────────────────────

function extractJson(raw: string): string {
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

async function callClaude(systemPrompt: string, userMessage: string, maxTokens: number): Promise<string> {
  const message = await getAnthropicClient().messages.create({
    model: MODEL_ID,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  if (message.stop_reason === "max_tokens") {
    throw new Error(`Réponse tronquée par le modèle (limite ${maxTokens} tokens atteinte). Réessayez.`);
  }
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Réponse vide de l'IA");
  return textBlock.text;
}

// ── Route ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const collaboratorId = b.collaborator_id;
  const step = Number(b.step ?? 1);

  if (typeof collaboratorId !== "string" || !collaboratorId.match(/^[0-9a-f-]{36}$/i)) {
    return NextResponse.json({ error: "collaborator_id invalide" }, { status: 400 });
  }

  if (![1, 2, 3, 4].includes(step)) {
    return NextResponse.json({ error: "Étape invalide (1-4)" }, { status: 400 });
  }

  const { allowed, count, limit } = await checkRateLimit(user.id, supabase);
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite de requêtes atteinte", details: `${count}/${limit} requêtes utilisées.` },
      { status: 429 },
    );
  }

  const { data: collaborator, error: collabError } = await supabase
    .from("collaborators")
    .select("*")
    .eq("id", collaboratorId)
    .eq("user_id", user.id)
    .single<Collaborator>();

  if (collabError || !collaborator) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }

  const profile = {
    role: collaborator.role,
    seniority: collaborator.seniority,
    period: collaborator.period ?? "development",
    relationship_started_at: collaborator.relationship_started_at,
    current_ops_topics: collaborator.current_ops_topics,
  };

  try {
    // ── Étape 1 : Axes de développement ─────────────────────────────────────
    if (step === 1) {
      console.log("[generate-plan] step 1 — axes");
      const raw = await callClaude(
        buildStep1AxesPrompt(profile),
        "Identifie les axes de développement pour ce collaborateur.",
        1000,
      );
      const data = JSON.parse(extractJson(raw)) as { axes: Array<{ axis: string; why: string }> };
      return NextResponse.json({ step: 1, axes: data.axes });
    }

    // ── Étape 2 : Cadence & attentes ────────────────────────────────────────
    if (step === 2) {
      console.log("[generate-plan] step 2 — cadence");
      const axes = b.axes as Array<{ axis: string; why: string }>;
      if (!Array.isArray(axes)) return NextResponse.json({ error: "axes manquants" }, { status: 400 });

      const raw = await callClaude(
        buildStep2CadencePrompt(profile, axes.map((a) => a.axis)),
        "Définis la cadence et les attentes mutuelles.",
        2000,
      );
      const data = JSON.parse(extractJson(raw)) as {
        proposed_cadence: string;
        mutual_expectations: string;
        intro: string;
        expectations_manager_to_collaborator: string[];
        expectations_collaborator_to_manager: string[];
        risks_to_watch: string[];
      };
      return NextResponse.json({ step: 2, cadence: data });
    }

    // ── Étape 3 : Questions par axe ─────────────────────────────────────────
    if (step === 3) {
      console.log("[generate-plan] step 3 — questions");
      const axes = b.axes as Array<{ axis: string; why: string }>;
      if (!Array.isArray(axes)) return NextResponse.json({ error: "axes manquants" }, { status: 400 });

      const raw = await callClaude(
        buildStep3QuestionsPrompt(profile, axes),
        "Génère les questions ouvertes pour chaque axe.",
        2000,
      );
      const data = JSON.parse(extractJson(raw)) as { questions_by_axis: Record<string, string[]> };
      return NextResponse.json({ step: 3, questions: data });
    }

    // ── Étape 4 : Career path + assemblage + sauvegarde ─────────────────────
    if (step === 4) {
      console.log("[generate-plan] step 4 — career path + save");
      const axes    = b.axes    as Array<{ axis: string; why: string }>;
      const cadence = b.cadence as {
        proposed_cadence: string;
        mutual_expectations: string;
        intro: string;
        expectations_manager_to_collaborator: string[];
        expectations_collaborator_to_manager: string[];
        risks_to_watch: string[];
      };
      const questions = b.questions as { questions_by_axis: Record<string, string[]> };

      if (!Array.isArray(axes) || !cadence || !questions) {
        return NextResponse.json({ error: "Données des étapes précédentes manquantes" }, { status: 400 });
      }

      const raw = await callClaude(
        buildStep4CareerPathPrompt(profile),
        "Établis le career path de ce collaborateur.",
        1200,
      );
      const careerPath = JSON.parse(extractJson(raw)) as {
        soft_skills: Array<{ skill: string; level: string; target: string; expectation?: string }>;
        hard_skills: Array<{ skill: string; level: string; target: string; expectation?: string }>;
      };

      const detectedAxes: DevelopmentAxis[] = axes.map((a) => ({
        axis: a.axis,
        why: a.why,
        sample_questions: questions.questions_by_axis[a.axis] ?? [],
      }));

      await supabase.from("managerial_plans").delete().eq("collaborator_id", collaboratorId);

      const { data: plan, error: insertError } = await supabase
        .from("managerial_plans")
        .insert({
          collaborator_id: collaboratorId,
          mutual_expectations: cadence.mutual_expectations,
          detected_development_axes: detectedAxes,
          proposed_cadence: cadence.proposed_cadence,
          raw_content: {
            intro: cadence.intro,
            expectations_manager_to_collaborator: cadence.expectations_manager_to_collaborator,
            expectations_collaborator_to_manager: cadence.expectations_collaborator_to_manager,
            risks_to_watch: cadence.risks_to_watch,
            career_path: { soft_skills: careerPath.soft_skills, hard_skills: careerPath.hard_skills },
          },
        })
        .select("*")
        .single<ManagerialPlan>();

      if (insertError || !plan) {
        return NextResponse.json({ error: "Erreur de sauvegarde", details: insertError?.message }, { status: 500 });
      }

      await recordUsage(user.id, "coach", supabase);
      return NextResponse.json(plan);
    }

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack?.slice(0, 500) : undefined;
    console.error(`[generate-plan] step ${step} error:`, msg, stack);
    return NextResponse.json(
      { error: "Échec de la génération", details: msg },
      { status: 502 },
    );
  }
}
