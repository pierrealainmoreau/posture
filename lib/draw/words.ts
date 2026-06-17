export type WordTheme = "bureau" | "animaux" | "nourriture";

export const DRAW_WORDS: Record<WordTheme, string[]> = {
  bureau: [
    "ordinateur", "café", "imprimante", "chaise", "tableau blanc",
    "post-it", "agrafeuse", "casque", "écran", "clavier",
    "machine à café", "ascenseur", "badge", "tasse", "stylo",
    "cahier", "trombone", "calendrier", "horloge", "plante verte",
    "fauteuil", "bureau", "photocopieuse", "corbeille", "téléphone",
    "projecteur", "tableau", "souris", "étagère", "classeur",
    "marqueur", "distributeur", "micro-ondes", "réfrigérateur", "ventilateur",
    "lampe", "clé USB", "câble", "prise", "bureau debout",
  ],
  animaux: [
    "chien", "chat", "lapin", "oiseau", "poisson",
    "éléphant", "girafe", "lion", "tigre", "singe",
    "grenouille", "serpent", "tortue", "dauphin", "requin",
    "canard", "vache", "cheval", "cochon", "mouton",
    "abeille", "papillon", "araignée", "crabe", "escargot",
    "hibou", "renard", "ours", "zèbre", "perroquet",
    "baleine", "crocodile", "pingouin", "koala", "poulpe",
    "flamant rose", "hérisson", "panda", "aigle", "chameau",
  ],
  nourriture: [
    "pizza", "sushi", "burger", "glace", "gâteau",
    "pomme", "banane", "cerise", "fraise", "pastèque",
    "carotte", "brocoli", "croissant", "baguette", "sandwich",
    "taco", "café", "chocolat", "cookie", "tarte",
    "crêpe", "spaghetti", "œuf", "fromage", "ananas",
    "citron", "champignon", "popcorn", "donut", "soupe",
    "framboise", "mangue", "avocat", "tomate", "maïs",
    "brioche", "éclair", "raisin", "oignon", "bonbon",
  ],
};

export function getWordsByTheme(theme: string): string[] {
  if (theme === "all")
    return [...DRAW_WORDS.bureau, ...DRAW_WORDS.animaux, ...DRAW_WORDS.nourriture];
  return DRAW_WORDS[theme as WordTheme] ?? DRAW_WORDS.bureau;
}

export function pickRandomWords(theme: string, count = 3): string[] {
  const pool = getWordsByTheme(theme);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
