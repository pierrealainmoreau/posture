export type EstimationExpressStatus = "lobby" | "playing" | "reveal" | "finished";

export interface EEQuestion {
  text: string;
  answer: number;
  min: number;
  max: number;
  unit: string;
  step: number;
  funfact?: string;
}

export interface EstimationExpressRoom {
  id: string;
  code: string;
  host_player_id: string | null;
  status: EstimationExpressStatus;
  creator_user_id: string | null;
  questions: EEQuestion[];
  current_question_index: number | null;
  total_questions: number;
  phase_started_at: string | null;
  created_at: string;
}

export interface EstimationExpressPlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  score: number;
  joined_at: string;
}

export interface EstimationExpressGuess {
  id: string;
  room_id: string;
  question_index: number;
  player_id: string;
  value: number;
  points_earned: number;
  submitted_at: string;
}

export const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

export const GUESS_SECONDS = 45;

export const QUESTION_BANK: Record<string, EEQuestion[]> = {
  fun: [
    { text: "Durée moyenne d'une réunion d'entreprise en France ?", answer: 52, min: 10, max: 120, unit: "min", step: 1, funfact: "71% des participants les jugent improductives malgré tout." },
    { text: "% des actifs qui vérifient leurs emails au lit avant de se lever ?", answer: 58, min: 0, max: 100, unit: "%", step: 1, funfact: "Ce chiffre monte à 70% chez les moins de 35 ans (étude Adobe)." },
    { text: "Nombre moyen d'emails reçus par un salarié par jour ?", answer: 121, min: 10, max: 300, unit: "emails", step: 1, funfact: "On en envoie en moyenne 40 par jour — le reste vient de l'extérieur." },
    { text: "% du temps de travail passé en réunions selon les managers ?", answer: 37, min: 0, max: 80, unit: "%", step: 1, funfact: "Pour les cadres supérieurs, ce chiffre dépasse 50%." },
    { text: "Durée moyenne de concentration avant distraction ?", answer: 47, min: 5, max: 300, unit: "sec", step: 1, funfact: "Soit moins d'une minute — contre 2,5 minutes il y a 20 ans (étude UC Irvine)." },
    { text: "% d'employés pleinement engagés dans leur travail ?", answer: 23, min: 0, max: 80, unit: "%", step: 1, funfact: "Le reste se partage entre 'peu engagés' (60%) et 'activement désengagés' (17%) — Gallup 2024." },
    { text: "Nombre moyen de mots de passe gérés par un employé ?", answer: 191, min: 10, max: 500, unit: "mdp", step: 1, funfact: "62% d'entre eux utilisent le même mot de passe pour plusieurs comptes (LastPass 2023)." },
    { text: "% de réunions jugées inutiles par leurs participants ?", answer: 71, min: 20, max: 100, unit: "%", step: 1, funfact: "Les cadres passent pourtant en moyenne 23h/semaine en réunion (HBR)." },
    { text: "Nombre de tasses de café consommées dans le monde chaque jour ?", answer: 2250, min: 100, max: 5000, unit: "M", step: 50, funfact: "Le café est la 2e marchandise la plus échangée dans le monde après le pétrole." },
    { text: "Vitesse de lecture moyenne d'un adulte ?", answer: 238, min: 50, max: 600, unit: "mots/min", step: 1, funfact: "Un lecteur rapide entraîné peut atteindre 600 mots/min avec une bonne compréhension." },
  ],
  tech: [
    { text: "Emails envoyés dans le monde chaque jour ?", answer: 333, min: 50, max: 800, unit: "Mds", step: 10, funfact: "45% sont des spams — soit ~150 milliards d'emails indésirables par jour." },
    { text: "% des emails marketing ouverts en moyenne ?", answer: 22, min: 0, max: 80, unit: "%", step: 1, funfact: "Le taux a chuté depuis iOS 15 qui bloque le pixel de tracking d'Apple Mail." },
    { text: "% du trafic web mondial généré par mobile ?", answer: 62, min: 20, max: 90, unit: "%", step: 1, funfact: "En 2010 il était de 2%. La bascule mobile > desktop a eu lieu en 2016." },
    { text: "Coût moyen d'une heure de panne pour une app SaaS B2B ?", answer: 5600, min: 100, max: 30000, unit: "€", step: 100, funfact: "Pour les grandes entreprises (500+ salariés) la moyenne monte à 21 000 €/heure (Gartner)." },
    { text: "% des cyberattaques causées par une erreur humaine ?", answer: 88, min: 10, max: 100, unit: "%", step: 1, funfact: "Le phishing représente à lui seul 36% de toutes les brèches de sécurité." },
    { text: "Durée moyenne d'un bug en production avant détection ?", answer: 49, min: 1, max: 200, unit: "jours", step: 1, funfact: "Les vulnérabilités critiques mettent en moyenne 60 jours à être patchées après détection." },
    { text: "% des projets IT qui dépassent leur budget initial ?", answer: 66, min: 10, max: 100, unit: "%", step: 1, funfact: "Et 17% d'entre eux menacent l'existence même de l'entreprise (McKinsey)." },
    { text: "Taux de conversion moyen d'un site e-commerce ?", answer: 3, min: 0, max: 20, unit: "%", step: 0.1, funfact: "Le top 10% des sites convertit à plus de 11% — la vitesse de chargement est le 1er levier." },
    { text: "Utilisateurs actifs de ChatGPT par semaine (2024) ?", answer: 100, min: 10, max: 500, unit: "M", step: 5, funfact: "ChatGPT a atteint 1 million d'utilisateurs en 5 jours — record absolu à l'époque." },
    { text: "Délai maximum qu'un utilisateur tolère pour charger une page web ?", answer: 3, min: 1, max: 15, unit: "sec", step: 0.5, funfact: "Chaque seconde de délai supplémentaire réduit les conversions de 7% (Google)." },
  ],
};
