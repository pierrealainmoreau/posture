export type Choice = {
  value: string;
  label: string;
  trait?: string;
};

export type Question = {
  id: string;
  text: string;
  theme: "perso" | "bureau" | "travail" | "all";
  choices: Choice[];
};

export const ALL_QUESTIONS: Question[] = [
  // ── Préférences perso ────────────────────────────────────────────────────
  {
    id: "perso-01",
    text: "Mer ou montagne ?",
    theme: "perso",
    choices: [
      { value: "mer", label: "🌊 Mer", trait: "voyages" },
      { value: "montagne", label: "🏔️ Montagne", trait: "exploration" },
    ],
  },
  {
    id: "perso-02",
    text: "Matin ou soir ?",
    theme: "perso",
    choices: [
      { value: "matin", label: "🌅 Matin", trait: "routines" },
      { value: "soir", label: "🌙 Soir", trait: "flexibilité" },
    ],
  },
  {
    id: "perso-03",
    text: "Ville ou campagne ?",
    theme: "perso",
    choices: [
      { value: "ville", label: "🏙️ Ville", trait: "énergie" },
      { value: "campagne", label: "🌾 Campagne", trait: "calme" },
    ],
  },
  {
    id: "perso-04",
    text: "Livre ou podcast ?",
    theme: "perso",
    choices: [
      { value: "livre", label: "📚 Livre", trait: "profondeur" },
      { value: "podcast", label: "🎙️ Podcast", trait: "curiosité" },
    ],
  },
  {
    id: "perso-05",
    text: "Vacances planifiées ou improvisées ?",
    theme: "perso",
    choices: [
      { value: "planifiées", label: "🗺️ Planifiées", trait: "planification" },
      { value: "improvisées", label: "🎲 Improvisées", trait: "flexibilité" },
    ],
  },
  {
    id: "perso-06",
    text: "Film ou série ?",
    theme: "perso",
    choices: [
      { value: "film", label: "🎬 Film", trait: "focus" },
      { value: "série", label: "📺 Série", trait: "routines" },
    ],
  },
  {
    id: "perso-07",
    text: "Chien ou chat ?",
    theme: "perso",
    choices: [
      { value: "chien", label: "🐶 Chien", trait: "collectif" },
      { value: "chat", label: "🐱 Chat", trait: "autonomie" },
    ],
  },
  {
    id: "perso-08",
    text: "Cuisine maison ou restaurants ?",
    theme: "perso",
    choices: [
      { value: "maison", label: "👨‍🍳 Cuisine maison", trait: "craft" },
      { value: "restos", label: "🍽️ Restaurants", trait: "réseau" },
    ],
  },
  {
    id: "perso-09",
    text: "Sport collectif ou solo ?",
    theme: "perso",
    choices: [
      { value: "collectif", label: "⚽ Sport collectif", trait: "collectif" },
      { value: "solo", label: "🏃 Sport solo", trait: "autonomie" },
    ],
  },
  {
    id: "perso-10",
    text: "Froid ou chaud ?",
    theme: "perso",
    choices: [
      { value: "froid", label: "❄️ Froid", trait: "calme" },
      { value: "chaud", label: "☀️ Chaud", trait: "énergie" },
    ],
  },
  {
    id: "perso-11",
    text: "Musique ou silence pour travailler ?",
    theme: "perso",
    choices: [
      { value: "musique", label: "🎵 Musique", trait: "énergie" },
      { value: "silence", label: "🔇 Silence", trait: "silence" },
    ],
  },
  {
    id: "perso-12",
    text: "Bruit de fond ou calme absolu ?",
    theme: "perso",
    choices: [
      { value: "bruit", label: "☕ Bruit de fond", trait: "énergie" },
      { value: "calme", label: "🤫 Calme absolu", trait: "concentration" },
    ],
  },
  {
    id: "perso-13",
    text: "Voyager léger ou confort maximal ?",
    theme: "perso",
    choices: [
      { value: "léger", label: "🎒 Léger", trait: "mobilité" },
      { value: "confort", label: "🧳 Confort maximal", trait: "planification" },
    ],
  },
  {
    id: "perso-14",
    text: "Café ou thé ?",
    theme: "perso",
    choices: [
      { value: "café", label: "☕ Café", trait: "énergie" },
      { value: "thé", label: "🍵 Thé", trait: "calme" },
    ],
  },
  {
    id: "perso-15",
    text: "Généraliste ou spécialiste ?",
    theme: "perso",
    choices: [
      { value: "généraliste", label: "🌐 Généraliste", trait: "curiosité" },
      { value: "spécialiste", label: "🎯 Spécialiste", trait: "profondeur" },
    ],
  },

  // ── Vie de bureau ────────────────────────────────────────────────────────
  {
    id: "bureau-01",
    text: "Slack ou mail ?",
    theme: "bureau",
    choices: [
      { value: "slack", label: "💬 Slack", trait: "synchrone" },
      { value: "mail", label: "📧 Mail", trait: "asynchrone" },
    ],
  },
  {
    id: "bureau-02",
    text: "Réunion courte et fréquente ou longue et rare ?",
    theme: "bureau",
    choices: [
      { value: "courte-fréquente", label: "⚡ Courte et fréquente", trait: "synchrone" },
      { value: "longue-rare", label: "🧘 Longue et rare", trait: "focus" },
    ],
  },
  {
    id: "bureau-03",
    text: "Agenda chargé ou plages libres ?",
    theme: "bureau",
    choices: [
      { value: "chargé", label: "📅 Agenda chargé", trait: "structure" },
      { value: "libre", label: "🌊 Plages libres", trait: "flexibilité" },
    ],
  },
  {
    id: "bureau-04",
    text: "Note de synthèse ou discussion orale ?",
    theme: "bureau",
    choices: [
      { value: "note", label: "📝 Note de synthèse", trait: "asynchrone" },
      { value: "oral", label: "🗣️ Discussion orale", trait: "synchrone" },
    ],
  },
  {
    id: "bureau-05",
    text: "Retour écrit ou verbal ?",
    theme: "bureau",
    choices: [
      { value: "écrit", label: "✍️ Retour écrit", trait: "asynchrone" },
      { value: "verbal", label: "💬 Retour verbal", trait: "synchrone" },
    ],
  },
  {
    id: "bureau-06",
    text: "Bureau rangé ou atmosphère créative ?",
    theme: "bureau",
    choices: [
      { value: "rangé", label: "🗂️ Bureau rangé", trait: "structure" },
      { value: "créatif", label: "🎨 Atmosphère créative", trait: "innovation" },
    ],
  },
  {
    id: "bureau-07",
    text: "Déjeuner en équipe ou seul ?",
    theme: "bureau",
    choices: [
      { value: "équipe", label: "👥 En équipe", trait: "réseau" },
      { value: "seul", label: "🥗 Seul", trait: "autonomie" },
    ],
  },
  {
    id: "bureau-08",
    text: "Musique au casque ou silence au bureau ?",
    theme: "bureau",
    choices: [
      { value: "casque", label: "🎧 Musique au casque", trait: "concentration" },
      { value: "silence", label: "🔇 Silence", trait: "silence" },
    ],
  },
  {
    id: "bureau-09",
    text: "Réunion debout ou assise ?",
    theme: "bureau",
    choices: [
      { value: "debout", label: "🧍 Debout", trait: "énergie" },
      { value: "assise", label: "💺 Assise", trait: "calme" },
    ],
  },
  {
    id: "bureau-10",
    text: "Brainstorm en groupe ou réflexion solo d'abord ?",
    theme: "bureau",
    choices: [
      { value: "groupe", label: "🧠 En groupe d'abord", trait: "collectif" },
      { value: "solo", label: "💭 Seul d'abord", trait: "autonomie" },
    ],
  },
  {
    id: "bureau-11",
    text: "Feedback immédiat ou après réflexion ?",
    theme: "bureau",
    choices: [
      { value: "immédiat", label: "⚡ Immédiat", trait: "synchrone" },
      { value: "réflexion", label: "🤔 Après réflexion", trait: "profondeur" },
    ],
  },
  {
    id: "bureau-12",
    text: "Plante sur le bureau ou non ?",
    theme: "bureau",
    choices: [
      { value: "plante", label: "🌱 Avec plante", trait: "calme" },
      { value: "non", label: "🖥️ Sans plante", trait: "structure" },
    ],
  },
  {
    id: "bureau-13",
    text: "Ordinateur fixe ou portable ?",
    theme: "bureau",
    choices: [
      { value: "fixe", label: "🖥️ Fixe", trait: "structure" },
      { value: "portable", label: "💻 Portable", trait: "mobilité" },
    ],
  },
  {
    id: "bureau-14",
    text: "Post-its ou notes digitales ?",
    theme: "bureau",
    choices: [
      { value: "post-its", label: "🟡 Post-its", trait: "craft" },
      { value: "digital", label: "📱 Notes digitales", trait: "structure" },
    ],
  },
  {
    id: "bureau-15",
    text: "Réunion du lundi matin ou du vendredi après-midi ?",
    theme: "bureau",
    choices: [
      { value: "lundi", label: "📋 Lundi matin", trait: "structure" },
      { value: "vendredi", label: "🎉 Vendredi après-midi", trait: "collectif" },
    ],
  },

  // ── Modes de travail ─────────────────────────────────────────────────────
  {
    id: "travail-01",
    text: "Télétravail ou présentiel ?",
    theme: "travail",
    choices: [
      { value: "télétravail", label: "🏠 Télétravail", trait: "télétravail" },
      { value: "présentiel", label: "🏢 Présentiel", trait: "présentiel" },
    ],
  },
  {
    id: "travail-02",
    text: "Routine fixe ou horaires flexibles ?",
    theme: "travail",
    choices: [
      { value: "routine", label: "🕐 Routine fixe", trait: "routines" },
      { value: "flexible", label: "🌊 Horaires flexibles", trait: "flexibilité" },
    ],
  },
  {
    id: "travail-03",
    text: "Objectifs à la semaine ou au mois ?",
    theme: "travail",
    choices: [
      { value: "semaine", label: "📆 À la semaine", trait: "structure" },
      { value: "mois", label: "🗓️ Au mois", trait: "autonomie" },
    ],
  },
  {
    id: "travail-04",
    text: "Travailler tôt le matin ou tard le soir ?",
    theme: "travail",
    choices: [
      { value: "matin", label: "🌅 Tôt le matin", trait: "routines" },
      { value: "soir", label: "🌙 Tard le soir", trait: "flexibilité" },
    ],
  },
  {
    id: "travail-05",
    text: "Deep work par blocs ou multitâche ?",
    theme: "travail",
    choices: [
      { value: "blocs", label: "🧱 Deep work par blocs", trait: "focus" },
      { value: "multitâche", label: "🎯 Multitâche", trait: "énergie" },
    ],
  },
  {
    id: "travail-06",
    text: "Documenter au fur et à mesure ou à la fin ?",
    theme: "travail",
    choices: [
      { value: "pendant", label: "✍️ Au fur et à mesure", trait: "process" },
      { value: "fin", label: "🏁 À la fin", trait: "autonomie" },
    ],
  },
  {
    id: "travail-07",
    text: "Process strict ou adaptation au cas par cas ?",
    theme: "travail",
    choices: [
      { value: "process", label: "📋 Process strict", trait: "process" },
      { value: "adaptation", label: "🎲 Adaptation", trait: "flexibilité" },
    ],
  },
  {
    id: "travail-08",
    text: "Décision en 1:1 ou en groupe ?",
    theme: "travail",
    choices: [
      { value: "1:1", label: "👤 En 1:1", trait: "autonomie" },
      { value: "groupe", label: "👥 En groupe", trait: "collectif" },
    ],
  },
  {
    id: "travail-09",
    text: "Sprints courts ou projets longs ?",
    theme: "travail",
    choices: [
      { value: "sprints", label: "⚡ Sprints courts", trait: "énergie" },
      { value: "longs", label: "🏗️ Projets longs", trait: "profondeur" },
    ],
  },
  {
    id: "travail-10",
    text: "Autonomie totale ou checkpoints réguliers ?",
    theme: "travail",
    choices: [
      { value: "autonomie", label: "🦅 Autonomie totale", trait: "autonomie" },
      { value: "checkpoints", label: "📍 Checkpoints réguliers", trait: "structure" },
    ],
  },
];

export function getQuestionsByTheme(theme: string): Question[] {
  if (theme === "all") return ALL_QUESTIONS;
  return ALL_QUESTIONS.filter((q) => q.theme === theme || q.theme === "all");
}

export function pickQuestions(theme: string, count: number): string[] {
  const pool = getQuestionsByTheme(theme);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((q) => q.id);
}

export function getQuestionById(id: string): Question | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id);
}
