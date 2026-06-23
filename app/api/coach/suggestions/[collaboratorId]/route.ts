import { NextRequest, NextResponse } from "next/server";
import { MODEL_ID, getAnthropicClient } from "@/lib/anthropic";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";
import {
  LEVELS,
  type Collaborator,
  type ManagerialPlan,
  type WeeklySession,
  type CollaboratorOkr,
  type CareerSkill,
  type CollaboratorSuggestions,
} from "@/lib/types";

function extractJson(raw: string): string {
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

function monthsSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
}

// GET — Récupère les suggestions stockées
export async function GET(
  _req: NextRequest,
  { params }: { params: { collaboratorId: string } },
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase
    .from("collaborator_suggestions")
    .select("*")
    .eq("collaborator_id", params.collaboratorId)
    .eq("user_id", user.id)
    .maybeSingle<CollaboratorSuggestions>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? null);
}

// POST — Génère (ou régénère) les suggestions via l'IA
export async function POST(
  _req: NextRequest,
  { params }: { params: { collaboratorId: string } },
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(user.id, supabase);
  if (!allowed) {
    return NextResponse.json({ error: "Limite de requêtes atteinte" }, { status: 429 });
  }

  // Fetch all data in parallel
  const [collabRes, planRes, sessionsRes, okrRes] = await Promise.all([
    supabase.from("collaborators").select("*").eq("id", params.collaboratorId).eq("user_id", user.id).single<Collaborator>(),
    supabase.from("managerial_plans").select("*").eq("collaborator_id", params.collaboratorId).maybeSingle<ManagerialPlan>(),
    supabase.from("weekly_sessions").select("*").eq("collaborator_id", params.collaboratorId).order("week_number", { ascending: true }),
    supabase.from("collaborator_okrs").select("*").eq("collaborator_id", params.collaboratorId).maybeSingle<CollaboratorOkr>(),
  ]);

  if (collabRes.error || !collabRes.data) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }

  const collab = collabRes.data;
  const plan = planRes.data ?? null;
  const sessions = (sessionsRes.data as WeeklySession[]) ?? [];
  const okr = okrRes.data ?? null;

  const nextSession = sessions.find((s) => !s.is_completed) ?? sessions[sessions.length - 1] ?? null;

  const allSkills: CareerSkill[] = [
    ...(plan?.raw_content.career_path?.soft_skills ?? []),
    ...(plan?.raw_content.career_path?.hard_skills ?? []),
  ];
  const belowTarget = allSkills.filter((s) => {
    const ci = LEVELS.indexOf(s.level as typeof LEVELS[number]);
    const ti = LEVELS.indexOf(s.target as typeof LEVELS[number]);
    return ci < ti;
  }).slice(0, 4);

  const months = monthsSince(collab.relationship_started_at);
  const axes = (plan?.detected_development_axes ?? []).map((a) => a.axis).join(", ") || "non définis";

  const okrLastUpdate = okr
    ? new Date(okr.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
    : null;
  const weakKr = okr?.key_results
    .filter((kr) => {
      const pct = parseFloat(kr.current ?? "0") || 0;
      const tgt = parseFloat(kr.target) || 100;
      return tgt > 0 && (pct / tgt) * 100 < 50;
    })
    .slice(0, 2) ?? [];

  const prompt = `Tu es un assistant expert en management individuel. Un manager te demande 3 suggestions d'action courtes et actionnables pour son collaborateur.

## Profil de ${collab.first_name} ${collab.last_name}
- Poste : ${collab.role} (${collab.seniority})
- Période : ${collab.period}
- En coaching depuis : ${months} mois${collab.current_ops_topics ? `\n- Sujets opérationnels : ${collab.current_ops_topics}` : ""}

## Plan managérial
- Axes de développement : ${axes}${plan ? `\n- Cadence : ${plan.proposed_cadence}` : "\n- Aucun plan généré"}

## Prochaine session 1:1
${nextSession
  ? `- Semaine ${nextSession.week_number} : "${nextSession.priority_topic_1}" / "${nextSession.priority_topic_2}"
- Axe de développement : ${nextSession.development_axis}
- Question inattendue : "${nextSession.unexpected_question}"`
  : "- Aucune session disponible"}

## Compétences (en dessous de la cible)
${belowTarget.length > 0
  ? belowTarget.map((s) => `- ${s.skill} : ${s.level} → cible ${s.target}`).join("\n")
  : "- Données non disponibles"}

## OKR individuel
${okr
  ? `- Objectif : "${okr.objective}"
- KR en retard (< 50%) : ${weakKr.length > 0 ? weakKr.map((kr) => `"${kr.label}" (${kr.current ?? "0"}/${kr.target} ${kr.unit})`).join(", ") : "aucun"}
- Dernière mise à jour : ${okrLastUpdate}`
  : "- Aucun OKR défini"}

## Instructions
Génère exactement 3 suggestions, une par domaine. Chaque suggestion doit être :
- Directe et actionnelle (1 à 2 phrases max)
- Personnalisée avec le prénom "${collab.first_name}"
- En français

Réponds uniquement en JSON, sans commentaire :
{
  "session": "suggestion pour le prochain 1:1",
  "career": "suggestion sur les compétences à développer",
  "okr": "suggestion sur le suivi des OKR"
}`;

  let parsed: { session: string; career: string; okr: string };
  try {
    const message = await getAnthropicClient().messages.create({
      model: MODEL_ID,
      max_tokens: 800,
      system: "Tu es un assistant de management. Réponds uniquement en JSON valide, sans markdown, sans explication.",
      messages: [{ role: "user", content: prompt }],
    });
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("Réponse vide");
    parsed = JSON.parse(extractJson(textBlock.text)) as typeof parsed;
    if (!parsed.session || !parsed.career || !parsed.okr) throw new Error("JSON incomplet");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur IA" },
      { status: 500 },
    );
  }

  await recordUsage(user.id, "coach", supabase);

  const { data, error } = await supabase
    .from("collaborator_suggestions")
    .upsert(
      {
        collaborator_id: params.collaboratorId,
        user_id: user.id,
        session_suggestion: parsed.session,
        career_suggestion: parsed.career,
        okr_suggestion: parsed.okr,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "collaborator_id" },
    )
    .select("*")
    .single<CollaboratorSuggestions>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
