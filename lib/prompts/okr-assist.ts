import type { KeyResult } from "@/lib/types";

export type OkrAssistStep = "improve_objective" | "suggest_key_results" | "critique";

export function buildOkrAssistPrompt(params: {
  step: OkrAssistStep;
  period: string;
  current_objective?: string;
  current_key_results?: KeyResult[];
}): { system: string; user: string; maxTokens: number } {
  const { step, period, current_objective, current_key_results } = params;

  if (step === "improve_objective") {
    return {
      system: `Tu es un expert OKR et coach en stratégie d'entreprise.
Ton rôle est de reformuler des objectifs OKR pour les rendre plus inspirants, ambitieux et qualitatifs.
Un bon objectif OKR est :
- Inspirant et motivant pour toute l'équipe
- Qualitatif (sans chiffres — les chiffres sont pour les Key Results)
- Clair et mémorable en une phrase
- Orienté impact, pas tâche

Réponds UNIQUEMENT avec le texte de l'objectif reformulé. Aucune introduction, aucune explication.`,
      user: `Reformule cet objectif d'entreprise pour la période ${period} :
"${current_objective}"`,
      maxTokens: 150,
    };
  }

  if (step === "suggest_key_results") {
    return {
      system: `Tu es un expert OKR. Tu proposes des Key Results mesurables, ambitieux et actionnables.
Un bon Key Result :
- Est quantifiable (contient une cible chiffrée)
- Est réaliste mais ambitieux ("moonshot à 70%")
- Mesure un résultat, pas une action
- Est indépendant des autres KRs

Réponds UNIQUEMENT en JSON valide, sans backticks ni commentaires :
[
  { "id": "kr1", "label": "Description du KR", "target": "valeur cible", "unit": "unité de mesure" },
  ...
]`,
      user: `Propose 3 à 5 Key Results pour cet objectif d'entreprise (période : ${period}) :
"${current_objective}"`,
      maxTokens: 600,
    };
  }

  // critique
  return {
    system: `Tu es un expert OKR. Tu analyses des OKRs et identifies des axes d'amélioration concrets et actionnables.
Sois direct, bienveillant et précis. Concentre-toi sur ce qui peut vraiment être amélioré.`,
    user: `Analyse cet OKR d'entreprise (période : ${period}) et identifie 2 à 3 points d'amélioration concrets.

Objectif : "${current_objective}"

Key Results :
${(current_key_results ?? []).map((kr, i) => `${i + 1}. ${kr.label} → cible : ${kr.target} ${kr.unit}`).join("\n")}

Réponds en français avec des bullet points courts (commencer chaque point par "• "). Sois direct.`,
    maxTokens: 400,
  };
}
