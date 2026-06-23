/**
 * Types partagés pour le générateur de feedbacks.
 * Définis ici pour rester cohérents entre la route API et l'UI.
 */

export type FeedbackType = "positive" | "corrective" | "mixed";

export type FeedbackTone = "caring" | "direct" | "coaching";

export type FeedbackFormat = "oral_1on1" | "written_slack" | "written_email";

export interface FeedbackRequest {
  context: string;
  type: FeedbackType;
  tone: FeedbackTone;
  format: FeedbackFormat;
}

export interface FeedbackStructure {
  situation: string;
  behavior: string;
  impact: string;
  opening_question: string;
}

export interface FeedbackResponse {
  feedback: string;
  structure: FeedbackStructure;
  warnings: string[];
  missing_context: string[];
  alternative_phrasing: string;
}

/**
 * Métadonnées sauvegardées dans l'historique local.
 */
export interface FeedbackHistoryEntry {
  id: string;
  createdAt: number;
  request: FeedbackRequest;
  response: FeedbackResponse;
}

// ─── Outil 2 : Entretien ─────────────────────────────────────────────────────

export type InterviewType =
  | "recruitment"
  | "performance_review"
  | "1on1"
  | "career_development"
  | "offboarding";

export interface InterviewRequest {
  type: InterviewType;
  context: string;
  candidateName?: string;
}

export interface InterviewQuestion {
  question: string;
  objective: string;
  follow_up: string[];
  green_flags: string[];
  red_flags: string[];
}

export interface InterviewResponse {
  preparation_tips: string[];
  questions: InterviewQuestion[];
  bias_warnings: string[];
  closing_tips: string;
  markdown_export: string;
}

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  recruitment: "Recrutement",
  performance_review: "Bilan annuel",
  "1on1": "1:1 régulier",
  career_development: "Développement de carrière",
  offboarding: "Entretien de départ",
};

// ─── Outil 3 : Entretien de recrutement (dual-mode) ─────────────────────────

export type RecruitmentMode = "recruiter" | "candidate" | "job-description";

// — Shared seniority / post-type enums —
export type SeniorityLevel = "1-3" | "4-5" | "6-8" | "8-10" | "10+";
export type PostType = "execution" | "strategie" | "mixte";
export type CandidatePriority = "career" | "balance" | "benefits";

export const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  "1-3": "1 à 3 ans",
  "4-5": "4 à 5 ans",
  "6-8": "6 à 8 ans",
  "8-10": "8 à 10 ans",
  "10+": "+ de 10 ans",
};

export const POST_TYPE_LABELS: Record<PostType, string> = {
  execution: "Exécution",
  strategie: "Stratégie",
  mixte: "Mixte",
};

export const CANDIDATE_PRIORITY_LABELS: Record<CandidatePriority, string> = {
  career: "Évolution de carrière",
  balance: "Équilibre de vie",
  benefits: "Avantages & rémunération",
};

// — Mode Recruteur —
export interface RecruiterRequest {
  mode: "recruiter";
  jobTitle: string;
  seniority: SeniorityLevel;
  postType: PostType;
  keySkills: string;
  companyValues?: string;
  context?: string;
}

export interface RecruiterQuestion {
  question: string;
  theme: string;
  objective: string;
  follow_up: string[];
  green_flags: string[];
  red_flags: string[];
}

export interface RecruiterResponse {
  preparation_tips: string[];
  questions: RecruiterQuestion[];
  bias_warnings: string[];
  closing_tips: string;
}

// — Grille d'évaluation (nouveau format recruteur) —
export type EvaluationCategory = "hard_skill" | "soft_skill" | "company_value";

export interface EvaluationQuestion {
  category: EvaluationCategory;
  skill_evaluated: string;
  question: string;
  criteria: string;
  follow_up: string;
}

export interface EvaluationGridResponse {
  preparation_tips: string[];
  questions: EvaluationQuestion[];
  bias_warnings: string[];
  closing_tips: string;
}

// — Mode Candidat —
export interface CandidateRequest {
  mode: "candidate";
  companyName: string;
  jobTitle: string;
  priority: CandidatePriority;
  jobUrl?: string;
}

export interface CandidateProbableQuestion {
  question: string;
  theme: string;
  how_to_answer: string;
  star_example: string;
}

export interface CandidateQuestionsToAsk {
  theme: string;
  questions: string[];
}

export interface CandidateResponse {
  preparation_tips: string[];
  probable_questions: CandidateProbableQuestion[];
  questions_to_ask: CandidateQuestionsToAsk[];
  closing_tips: string;
}

export type RecruitmentRequest = RecruiterRequest | CandidateRequest;

// — Mode Fiche de poste —
export type ContractType = "cdi" | "cdd" | "stage" | "alternance" | "freelance";

export const CONTRACT_LABELS: Record<ContractType, string> = {
  cdi: "CDI",
  cdd: "CDD",
  stage: "Stage",
  alternance: "Alternance",
  freelance: "Freelance",
};

export interface JobDescriptionRequest {
  mode: "job-description";
  jobTitle: string;
  contractType: ContractType;
  seniority: SeniorityLevel;
  department?: string;
  teamContext?: string;
  keyMissions: string;
  technicalSkills?: string;
  softSkills?: string;
  perks?: string;
}

export interface JobDescriptionResponse {
  missions: {
    intro: string;
    items: string[];
  };
  competences: {
    intro: string;
    required: string[];
    nice_to_have: string[];
  };
}

/* ========================================================================== */
/*  Outil 3bis — Académie Posture (refonte du Quiz)                            */
/* ========================================================================== */

export type BadgeTier = "bronze" | "silver" | "gold" | "final";

export interface AcademieQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  explanation: string;
}

export interface AcademieQuiz {
  id: string;
  title: string;
  description: string;
  tier: BadgeTier;
  questions: AcademieQuestion[];
  passing_score_percent: number;
}

export interface AcademiePathway {
  id: string;
  title: string;
  short_description: string;
  long_description: string;
  icon_name: string;
  color_theme: "blue" | "purple" | "amber" | "emerald" | "orange" | "teal" | "violet" | "cyan" | "rose";
  estimated_minutes: number;
  quizzes: AcademieQuiz[];
  final_badge: {
    name: string;
    description: string;
  };
  is_available: boolean;
}

export interface QuizProgress {
  best_score: number;
  total_questions: number;
  passed: boolean;
  attempts: number;
  last_attempt_at: number;
}

export interface PathwayProgress {
  quizzes: Record<string, QuizProgress>;
}

export interface AcademieProgress {
  pathways: Record<string, PathwayProgress>;
  badges_earned: string[];
}

export const ACADEMIE_CONFIG = {
  standardQuizQuestions: 5,
  finalQuizQuestions: 8,
  timerSeconds: 30,
  passingScorePercent: 80,
} as const;

// ─── Outil 3 — Quiz Communication Non Violente ───────────────────────────────

export interface QuizQuestion {
  id: string;
  question: string;
  /** Les 4 options. L'index 0 est toujours la bonne réponse — sera mélangé à l'affichage. */
  options: [string, string, string, string];
  /** Explication pédagogique affichée en révision */
  explanation: string;
  /** Thème CNV (observation, sentiment, besoin, demande, etc.) */
  theme: string;
}

export interface QuizAnswer {
  questionId: string;
  /** Index choisi par l'utilisateur dans les options mélangées (0-3) */
  selectedIndex: number;
  /** Index de la bonne réponse dans les options mélangées (0-3) */
  correctIndex: number;
  /** true si selectedIndex === correctIndex */
  isCorrect: boolean;
  /** -1 si timeout */
  timeSpentMs: number;
}

export interface QuizResult {
  questions: QuizQuestion[];
  /** Pour chaque question, l'ordre des options réellement affichées (indices vers QuizQuestion.options) */
  shuffledOptionsOrder: number[][];
  answers: QuizAnswer[];
  totalScore: number;
  startedAt: number;
  endedAt: number;
}

/* ========================================================================== */
/*  Outil 5 — Icebreakers                                                      */
/* ========================================================================== */

export type IcebreakerCategory =
  | "identity"
  | "preferences"
  | "anecdotes"
  | "vision"
  | "offbeat"
  | "surprise";

export interface IcebreakerQuestion {
  id: string;
  question: string;
  category: IcebreakerCategory;
}

export const ICEBREAKER_CATEGORY_LABELS: Record<IcebreakerCategory, string> = {
  identity: "Identité",
  preferences: "Préférences",
  anecdotes: "Champ personnalisé",
  vision: "Vision",
  offbeat: "Décalé",
  surprise: "Surprise",
};

export const ICEBREAKER_CATEGORY_COLORS: Record<
  IcebreakerCategory,
  { bg: string; text: string; border: string }
> = {
  identity:    { bg: "bg-blue-50",    text: "text-blue-900",    border: "border-blue-200"    },
  preferences: { bg: "bg-purple-50",  text: "text-purple-900",  border: "border-purple-200"  },
  anecdotes:   { bg: "bg-emerald-50", text: "text-emerald-900", border: "border-emerald-200" },
  vision:      { bg: "bg-orange-50",  text: "text-orange-900",  border: "border-orange-200"  },
  offbeat:     { bg: "bg-amber-50",   text: "text-amber-900",   border: "border-amber-200"   },
  surprise:    { bg: "bg-pink-50",    text: "text-pink-900",    border: "border-pink-200"    },
};

/* ========================================================================== */
/*  Outil 4 — 1:1 Coach                                                        */
/* ========================================================================== */

export type CoachSeniority = "junior" | "confirmed" | "senior";

export type CollaboratorPeriod = "onboarding" | "development" | "retention";

export const COLLABORATOR_PERIOD_LABELS: Record<CollaboratorPeriod, string> = {
  onboarding: "Onboarding",
  development: "Développement",
  retention: "Fidélisation",
};

export const COLLABORATOR_PERIOD_DESCRIPTIONS: Record<CollaboratorPeriod, string> = {
  onboarding: "Nouveau dans le poste — priorité à l'acclimatation",
  development: "En progression — montée en compétence",
  retention: "Confirmé — engagement et projection",
};

export interface Collaborator {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
  seniority: CoachSeniority;
  period: CollaboratorPeriod;
  relationship_started_at: string;
  current_ops_topics: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentAxis {
  axis: string;
  why: string;
  sample_questions: string[];
}

export type ExpertiseLevel = "débutant" | "intermédiaire" | "avancé" | "expert";
export const LEVELS = ["débutant", "intermédiaire", "avancé", "expert"] as const;

export interface CareerSkill {
  skill: string;
  level: ExpertiseLevel;
  target: ExpertiseLevel;
  /** Exemple concret de ce qu'on attend au niveau cible (généré par l'IA, 1 phrase) */
  expectation?: string;
}

export interface CareerPath {
  soft_skills: CareerSkill[];
  hard_skills: CareerSkill[];
}

export interface ManagerialPlan {
  id: string;
  collaborator_id: string;
  mutual_expectations: string;
  detected_development_axes: DevelopmentAxis[];
  proposed_cadence: string;
  raw_content: {
    intro: string;
    expectations_manager_to_collaborator: string[];
    expectations_collaborator_to_manager: string[];
    risks_to_watch: string[];
    career_path?: CareerPath;
  };
  created_at: string;
}

export interface WeeklySession {
  id: string;
  collaborator_id: string;
  week_number: number;
  scheduled_date: string | null;
  priority_topic_1: string;
  priority_topic_2: string;
  exploration_topic: string;
  unexpected_question: string;
  development_axis: string;
  manager_notes: string | null;
  is_completed: boolean;
  raw_content: {
    priority_topic_1_rationale: string;
    priority_topic_2_rationale: string;
    exploration_rationale: string;
    suggested_follow_ups: string[];
  };
  created_at: string;
  updated_at: string;
}

// ── OKR ───────────────────────────────────────────────────────────────────

export interface KeyResult {
  id: string;
  label: string;
  target: string;
  unit: string;
  current?: string;
}

export interface CompanyOkr {
  id: string;
  user_id: string;
  period: string;
  objective: string;
  key_results: KeyResult[];
  created_at: string;
  updated_at: string;
}

export interface CollaboratorOkr {
  id: string;
  collaborator_id: string;
  company_okr_id: string;
  objective: string;
  key_results: KeyResult[];
  alignment_rationale: string | null;
  created_at: string;
  updated_at: string;
}

// ── Manuel d'utilisation ─────────────────────────────────────────────────

export type ManualAnswers = Record<string, string>; // questionId → answer

export interface CollaboratorManual {
  id: string;
  collaborator_id: string;
  user_id: string;
  token: string;
  answers: ManualAnswers;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Suggestions IA hebdomadaires ─────────────────────────────────────────

export interface CollaboratorSuggestions {
  id: string;
  collaborator_id: string;
  user_id: string;
  session_suggestion: string;
  career_suggestion: string;
  okr_suggestion: string;
  generated_at: string;
  created_at: string;
}

// ── Coach labels & config ─────────────────────────────────────────────────

export const COACH_SENIORITY_LABELS: Record<CoachSeniority, string> = {
  junior: "Junior",
  confirmed: "Confirmé",
  senior: "Senior",
};

export const COACH_CONFIG = {
  freeWeeksLimit: 4,
  premiumWeeksLimit: 12,
} as const;

export const COACH_COLLAB_LIMITS = {
  free: 4,
  premium: 8,
} as const;

export const DEVELOPMENT_AXES = [
  "Compétences",
  "Autonomie",
  "Impact",
  "Motivation",
  "Visibilité",
  "Collaboration",
  "Leadership",
  "Apprentissage",
] as const;

export type DevelopmentAxisName = typeof DEVELOPMENT_AXES[number];

// V2: Auth Supabase réelle + RLS activée
// V4: Stripe Checkout pour vrai premium
// V2: Notifications email à J-1 du 1:1
// V3: Vue agenda calendaire avec toutes les sessions de tous les collaborateurs
// V2: Génération automatique des semaines en batch
// V4: Sync Google Calendar (créer l'event 1:1 directement)

// ─── Mappings UI <-> valeurs internes (Outil 1) ──────────────────────────────

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  positive: "Positif",
  corrective: "Correctif",
  mixed: "Mixte",
};

export const FEEDBACK_TONE_LABELS: Record<FeedbackTone, string> = {
  caring: "Bienveillant",
  direct: "Direct",
  coaching: "Coaching",
};

export const FEEDBACK_FORMAT_LABELS: Record<FeedbackFormat, string> = {
  oral_1on1: "Oral — script pour un 1:1",
  written_slack: "Écrit — message Slack",
  written_email: "Écrit — email",
};
