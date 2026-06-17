export interface Question {
  id: string;
  a: string;
  b: string;
  context: string;
}

export interface CustomQuestion {
  id: string; // format: "custom_<timestamp>"
  a: string;
  b: string;
  context: string;
}

export const ALL_QUESTIONS: Question[] = [
  { id: "q01", a: "Async",             b: "Sync",                context: "Communication" },
  { id: "q02", a: "Doc d'abord",       b: "Code d'abord",        context: "Méthode" },
  { id: "q03", a: "Planning poker",    b: "Feeling d'équipe",    context: "Estimation" },
  { id: "q04", a: "One-on-one",        b: "Réunion d'équipe",    context: "Feedback" },
  { id: "q05", a: "Remote",            b: "Bureau",              context: "Environnement" },
  { id: "q06", a: "Spécialiste",       b: "Généraliste",         context: "Profil" },
  { id: "q07", a: "Process strict",    b: "Improvisation",       context: "Approche" },
  { id: "q08", a: "Matin",             b: "Soir",                context: "Énergie" },
  { id: "q09", a: "Réunions courtes",  b: "Moins de réunions",   context: "Organisation" },
  { id: "q10", a: "Feedback direct",   b: "Feedback doux",       context: "Management" },
  { id: "q11", a: "Micro-tâches",      b: "Gros projets",        context: "Découpage" },
  { id: "q12", a: "Tableau blanc",     b: "Notion / Doc",        context: "Outil" },
  { id: "q13", a: "Sprint 1 sem.",     b: "Sprint 2 sem.",       context: "Agile" },
  { id: "q14", a: "Solo",              b: "Pair programming",    context: "Travail" },
  { id: "q15", a: "Café",              b: "Thé",                 context: "Carburant" },
  { id: "q16", a: "Décision rapide",   b: "Décision collective", context: "Décision" },
  { id: "q17", a: "Règles claires",    b: "Flexibilité totale",  context: "Cadre" },
  { id: "q18", a: "Présentiel",        b: "Visio",               context: "Réunion" },
  { id: "q19", a: "Sous-estimer",      b: "Surestimer",          context: "Estimation" },
  { id: "q20", a: "Célébrer chaque victoire", b: "Focus sur l'objectif final", context: "Culture" },
];

export function getQuestionById(id: string): Question | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id);
}

/** Résout une question : custom d'abord, puis built-in. */
export function resolveQuestion(
  questionId: string,
  customQuestions: CustomQuestion[] = []
): Question | undefined {
  if (questionId.startsWith("custom_")) {
    return customQuestions.find((q) => q.id === questionId);
  }
  return getQuestionById(questionId);
}

export function pickRandomQuestions(count: number): string[] {
  const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, ALL_QUESTIONS.length)).map((q) => q.id);
}
