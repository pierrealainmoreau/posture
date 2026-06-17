import type { SeniorityLevel, PostType, CandidatePriority } from "@/lib/types";

export type { RecruitmentMode } from "@/lib/types";

export interface BuildRecruiterPromptParams {
  jobTitle: string;
  seniority: SeniorityLevel;
  postType: PostType;
  keySkills: string;
  context?: string;
}

export interface BuildCandidatePromptParams {
  companyName: string;
  jobTitle: string;
  priority: CandidatePriority;
  jobListingContent?: string;
}

const POST_TYPE_DESC: Record<PostType, string> = {
  execution: "exécution opérationnelle",
  strategie: "leadership stratégique",
  mixte: "mixte (individuel + transversal)",
};

const SENIORITY_DESC: Record<SeniorityLevel, string> = {
  "1-3": "junior (1-3 ans)",
  "4-5": "confirmé (4-5 ans)",
  "6-8": "senior (6-8 ans)",
  "8-10": "expert/lead (8-10 ans)",
  "10+": "très senior (10+ ans)",
};

const PRIORITY_DESC: Record<CandidatePriority, string> = {
  career: "évolution de carrière",
  balance: "équilibre vie pro/perso",
  benefits: "rémunération et avantages",
};

export function buildRecruiterSystemPrompt({
  jobTitle,
  seniority,
  postType,
  keySkills,
  context,
}: BuildRecruiterPromptParams): string {
  return `Tu es expert RH. Génère un guide d'entretien en JSON, en français. Sois concis (max 20 mots par champ texte).

POSTE : ${jobTitle} | ${SENIORITY_DESC[seniority]} | ${POST_TYPE_DESC[postType]} | Compétence clé : ${keySkills}
${context?.trim() ? `Contexte : ${context.trim().slice(0, 200)}` : ""}

GÉNÈRE EXACTEMENT 3 QUESTIONS :
- 1 comportementale STAR (theme "Comportement") : commencer par "Racontez-moi" ou "Décrivez"
- 1 compétences (theme "Compétences") : évaluer ${keySkills}
- 1 motivation/fit (theme "Motivation" ou "Fit culturel")

Retourne UNIQUEMENT ce JSON valide (pas de texte avant ni après, pas de \`\`\`json) :
{"preparation_tips":["conseil court 1","conseil court 2"],"questions":[{"question":"Question ouverte","theme":"Comportement","objective":"Ce que révèle la question","follow_up":["Une relance"],"green_flags":["Signal positif"],"red_flags":["Signal d'alerte"]}],"bias_warnings":[],"closing_tips":"Conseil de clôture court"}`.trim();
}

export function buildCandidateSystemPrompt({
  companyName,
  jobTitle,
  priority,
  jobListingContent,
}: BuildCandidatePromptParams): string {
  const listing = jobListingContent?.trim()
    ? ` | Annonce : ${jobListingContent.trim().slice(0, 400)}`
    : "";

  return `Tu es expert en préparation d'entretien. Génère un guide en JSON, en français. Sois concis (max 20 mots par champ texte).

CANDIDAT : ${companyName} | ${jobTitle} | Priorité : ${PRIORITY_DESC[priority]}${listing}

GÉNÈRE EXACTEMENT 3 QUESTIONS PROBABLES :
- 1 comportementale STAR (theme "Comportement") : star_example = canevas court avec [placeholders]
- 1 compétences (theme "Compétences")
- 1 motivation (theme "Motivation") : spécifique à ${companyName}, liée à "${PRIORITY_DESC[priority]}"

QUESTIONS À POSER : 2 groupes de 2 questions ("Le poste" et "L'équipe").

Retourne UNIQUEMENT ce JSON valide (pas de texte avant ni après, pas de \`\`\`json) :
{"preparation_tips":["conseil court 1","conseil court 2"],"probable_questions":[{"question":"Question du recruteur","theme":"Comportement","how_to_answer":"Méthode courte","star_example":"[Situation] [Action] [Résultat]"}],"questions_to_ask":[{"theme":"Le poste","questions":["Question 1","Question 2"]},{"theme":"L'équipe","questions":["Question 1","Question 2"]}],"closing_tips":"Conseil de clôture court"}`.trim();
}
