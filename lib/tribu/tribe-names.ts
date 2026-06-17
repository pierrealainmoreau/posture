export type TribeProfile = {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  traits: string[];
};

export const TRIBE_PROFILES: TribeProfile[] = [
  {
    id: "explorateurs",
    name: "Les Explorateurs",
    emoji: "🧭",
    tagline: "Curieux de tout, jamais au même endroit",
    traits: ["voyages", "curiosité", "télétravail"],
  },
  {
    id: "batisseurs",
    name: "Les Bâtisseurs",
    emoji: "🏗️",
    tagline: "On préfère faire que parler",
    traits: ["craft", "présentiel", "structure"],
  },
  {
    id: "equilibristes",
    name: "Les Équilibristes",
    emoji: "⚖️",
    tagline: "Le bon rythme, ni trop vite ni trop lentement",
    traits: ["calme", "flexibilité", "routines"],
  },
  {
    id: "catalyseurs",
    name: "Les Catalyseurs",
    emoji: "⚡",
    tagline: "Là où ça bouge, ils arrivent les premiers",
    traits: ["énergie", "synchrone", "collectif"],
  },
  {
    id: "strateges",
    name: "Les Stratèges",
    emoji: "♟️",
    tagline: "Deux coups d'avance, toujours",
    traits: ["planification", "structure", "process"],
  },
  {
    id: "nomades",
    name: "Les Nomades",
    emoji: "🌍",
    tagline: "Le bureau, c'est là où est le wifi",
    traits: ["mobilité", "flexibilité", "asynchrone"],
  },
  {
    id: "artisans",
    name: "Les Artisans",
    emoji: "🛠️",
    tagline: "La qualité ne se négocie pas",
    traits: ["profondeur", "craft", "focus"],
  },
  {
    id: "connecteurs",
    name: "Les Connecteurs",
    emoji: "🤝",
    tagline: "Sans eux, personne ne se parlerait",
    traits: ["réseau", "présentiel", "collectif"],
  },
  {
    id: "visionnaires",
    name: "Les Visionnaires",
    emoji: "🔭",
    tagline: "Ils voient ce qui n'existe pas encore",
    traits: ["curiosité", "innovation", "autonomie"],
  },
  {
    id: "gardiens",
    name: "Les Gardiens",
    emoji: "🌿",
    tagline: "Stabilité, fiabilité, durée",
    traits: ["routines", "structure", "calme"],
  },
  {
    id: "solos",
    name: "Les Solos",
    emoji: "🎧",
    tagline: "Meilleurs résultats casque sur les oreilles",
    traits: ["concentration", "autonomie", "silence"],
  },
  {
    id: "federateurs",
    name: "Les Fédérateurs",
    emoji: "🎯",
    tagline: "L'équipe avant tout",
    traits: ["collectif", "synchrone", "réseau"],
  },
];
