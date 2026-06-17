import type { KeyResult } from "@/lib/types";

export function buildCollaboratorOkrPrompt(params: {
  role: string;
  seniority: string;
  company_objective: string;
  company_key_results: KeyResult[];
  period: string;
}): string {
  const { role, seniority, company_objective, company_key_results, period } = params;

  return `Tu es un expert OKR et coach managérial.
À partir de l'OKR d'entreprise, génère un OKR individuel adapté à ce collaborateur — aligné avec la stratégie, mais ancré dans son périmètre réel.

# OKR Entreprise — ${period}
Objectif : ${company_objective}
Key Results :
${company_key_results.map((kr) => `- ${kr.label} → cible : ${kr.target} ${kr.unit}`).join("\n")}

# Profil du collaborateur
Rôle : ${role}
Séniorité : ${seniority}

# Règles de génération
1. L'objectif individuel doit être inspirant et adapté au rôle (pas une paraphrase de l'objectif entreprise).
2. Propose 2 à 4 Key Results concrets, actionnables dans le périmètre direct du collaborateur.
3. Les KRs doivent contribuer de façon visible à au moins un KR entreprise.
4. Explique en 1 à 2 phrases courtes pourquoi cet OKR est aligné avec la stratégie de l'entreprise.

Réponds UNIQUEMENT en JSON valide, sans backticks ni commentaires :
{
  "objective": "...",
  "key_results": [
    { "id": "kr1", "label": "...", "target": "...", "unit": "..." }
  ],
  "alignment_rationale": "..."
}`;
}
