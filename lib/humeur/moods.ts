export interface Mood {
  id: string;
  index: number; // 1-9, correspond au numéro d'image dans chaque set
  label: string;
  sublabel: string;
}

export const MOODS: Mood[] = [
  { id: "energised",   index: 1, label: "Chargé·e à bloc",  sublabel: "Plein d'énergie" },
  { id: "happy",       index: 2, label: "En forme",          sublabel: "Bonne humeur" },
  { id: "calm",        index: 3, label: "Serein·e",          sublabel: "Calme et posé·e" },
  { id: "focused",     index: 4, label: "Concentré·e",       sublabel: "Dans la zone" },
  { id: "tired",       index: 5, label: "Fatigué·e",         sublabel: "Besoin de recharge" },
  { id: "stressed",    index: 6, label: "Sous pression",     sublabel: "Beaucoup de choses" },
  { id: "anxious",     index: 7, label: "Anxieux·se",        sublabel: "Un peu tendu·e" },
  { id: "creative",    index: 8, label: "Créatif·ve",        sublabel: "Les idées fusent" },
  { id: "overwhelmed", index: 9, label: "Débordé·e",         sublabel: "Trop de trucs" },
];

// ── Sets d'images ──────────────────────────────────────────────────────────────

export interface MoodSet {
  id: string;
  label: string;
}

export const MOOD_SETS: MoodSet[] = [
  { id: "moutons",   label: "Moutons" },
  { id: "michael",   label: "Michael Scott" },
  { id: "michael2",  label: "Michael Scott 2" },
  { id: "duck",      label: "Canard" },
  { id: "jimcarrey", label: "Jim Carrey" },
  { id: "loutre",    label: "Loutres" },
  { id: "willsmith", label: "Will Smith" },
  { id: "dory",      label: "Dory" },
];

/** URL de l'image pour un mood dans un set donné */
export function getMoodImageUrl(setId: string, moodIndex: number): string {
  return `/humeur/sets/${setId}/${moodIndex}.jpg`;
}

/** Set déterministe à partir du code de room — même set pour tous les joueurs */
export function pickSetForRoom(code: string): string {
  const sum = code.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return MOOD_SETS[sum % MOOD_SETS.length].id;
}

/** Set aléatoire pour le mode direct */
export function pickRandomSet(): string {
  return MOOD_SETS[Math.floor(Math.random() * MOOD_SETS.length)].id;
}

export function getMoodById(id: string): Mood | undefined {
  return MOODS.find((m) => m.id === id);
}
