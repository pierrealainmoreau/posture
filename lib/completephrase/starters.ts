export interface StarterPhrase {
  id: string;
  text: string;
  category: "energie" | "blocages" | "fierte" | "equipe" | "projet";
}

export const STARTER_PHRASES: StarterPhrase[] = [
  // Énergie & humeur
  { id: "s01", text: "En ce moment je travaille bien quand…", category: "energie" },
  { id: "s02", text: "Ce qui me recharge l'énergie c'est…", category: "energie" },
  { id: "s03", text: "Ma meilleure heure de la journée c'est…", category: "energie" },

  // Blocages
  { id: "s04", text: "Ce qui me freine en ce moment c'est…", category: "blocages" },
  { id: "s05", text: "Je serais plus efficace si…", category: "blocages" },
  { id: "s06", text: "Ce qui m'a le plus coûté d'énergie cette semaine c'est…", category: "blocages" },

  // Fierté
  { id: "s07", text: "Je suis fier(e) d'avoir…", category: "fierte" },
  { id: "s08", text: "La semaine dernière, j'ai réussi à…", category: "fierte" },
  { id: "s09", text: "Ce dont je suis le plus satisfait(e) en ce moment c'est…", category: "fierte" },

  // Équipe
  { id: "s10", text: "Ce que j'apprécie dans notre équipe c'est…", category: "equipe" },
  { id: "s11", text: "On travaillerait mieux ensemble si…", category: "equipe" },
  { id: "s12", text: "Ce dont j'aurais besoin de l'équipe c'est…", category: "equipe" },

  // Projet
  { id: "s13", text: "Ce qui m'enthousiasme dans notre projet c'est…", category: "projet" },
  { id: "s14", text: "Mon plus grand défi en ce moment c'est…", category: "projet" },
  { id: "s15", text: "Dans 3 mois, j'aimerais qu'on ait…", category: "projet" },
];

export const CATEGORY_LABELS: Record<StarterPhrase["category"], string> = {
  energie:  "Énergie",
  blocages: "Blocages",
  fierte:   "Fierté",
  equipe:   "Équipe",
  projet:   "Projet",
};

export const POST_IT_COLORS = [
  "bg-yellow-100 dark:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800",
  "bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800",
  "bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800",
  "bg-pink-100 dark:bg-pink-900/40 border-pink-200 dark:border-pink-800",
  "bg-orange-100 dark:bg-orange-900/40 border-orange-200 dark:border-orange-800",
  "bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800",
];
