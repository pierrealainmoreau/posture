import { NextRequest, NextResponse } from "next/server";
import { MODEL_ID, MAX_TOKENS_COACH, getAnthropicClient } from "@/lib/anthropic";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildOnboardingMilestonePrompt } from "@/lib/prompts/onboarding-milestone";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";
import type { Collaborator, OnboardingChecklist, OnboardingMilestoneType } from "@/lib/types";

function extractJson(raw: string): string {
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { milestoneId: string } },
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { allowed } = await checkRateLimit(user.id, supabase);
    if (!allowed) {
      return NextResponse.json({ error: "Limite de requêtes atteinte" }, { status: 429 });
    }

    const { milestoneId } = params;

    const { data: milestone } = await supabase
      .from("interview_milestones")
      .select("*, interview:interviews(user_id, collaborator:collaborators(*))")
      .eq("id", milestoneId)
      .single();

    type MilestoneWithRelations = {
      id: string;
      milestone_type: string;
      interview: { user_id: string; collaborator: Collaborator } | null;
    };
    const ms = milestone as MilestoneWithRelations | null;

    if (!ms || ms.interview?.user_id !== user.id) {
      return NextResponse.json({ error: "Jalon introuvable" }, { status: 404 });
    }

    const collaborator = ms.interview!.collaborator;

    const systemPrompt = buildOnboardingMilestonePrompt({
      milestoneType: ms.milestone_type as OnboardingMilestoneType,
      role: collaborator.role,
      seniority: collaborator.seniority,
    });

    let parsed: OnboardingChecklist;
    try {
      const message = await getAnthropicClient().messages.create({
        model: MODEL_ID,
        max_tokens: MAX_TOKENS_COACH,
        system: systemPrompt,
        messages: [{ role: "user", content: `Génère la checklist pour le jalon ${ms.milestone_type.toUpperCase()}.` }],
      });

      if (message.stop_reason === "max_tokens") {
        return NextResponse.json({ error: "Réponse tronquée. Réessayez." }, { status: 502 });
      }

      const textBlock = message.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        return NextResponse.json({ error: "Réponse vide de l'IA" }, { status: 502 });
      }

      parsed = JSON.parse(extractJson(textBlock.text)) as OnboardingChecklist;
    } catch (e) {
      return NextResponse.json(
        { error: "Échec de la génération", details: e instanceof Error ? e.message : "Erreur inconnue" },
        { status: 502 },
      );
    }

    const checklistWithIds: OnboardingChecklist = {
      axes: parsed.axes.map((axis) => ({
        name: axis.name,
        items: axis.items.map((item) => ({
          id: crypto.randomUUID(),
          text: item.text,
          checked: false,
        })),
      })),
    };

    const { data: updated, error: updateError } = await supabase
      .from("interview_milestones")
      .update({
        checklist: checklistWithIds,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", milestoneId)
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: "Erreur de sauvegarde", details: updateError?.message }, { status: 500 });
    }

    await recordUsage(user.id, "teams", supabase);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
