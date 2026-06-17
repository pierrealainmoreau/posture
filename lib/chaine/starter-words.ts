export type StarterWord = {
  word: string;
  category: "nature" | "voyage" | "quotidien" | "abstrait" | "bureau";
};

export const STARTER_WORDS: StarterWord[] = [
  // Nature (12)
  { word: "Forêt",    category: "nature" },
  { word: "Océan",    category: "nature" },
  { word: "Volcan",   category: "nature" },
  { word: "Brume",    category: "nature" },
  { word: "Désert",   category: "nature" },
  { word: "Cascade",  category: "nature" },
  { word: "Falaise",  category: "nature" },
  { word: "Tempête",  category: "nature" },
  { word: "Glacier",  category: "nature" },
  { word: "Prairie",  category: "nature" },
  { word: "Marée",    category: "nature" },
  { word: "Caverne",  category: "nature" },

  // Voyage (12)
  { word: "Valise",     category: "voyage" },
  { word: "Passeport",  category: "voyage" },
  { word: "Escale",     category: "voyage" },
  { word: "Carte",      category: "voyage" },
  { word: "Boussole",   category: "voyage" },
  { word: "Billet",     category: "voyage" },
  { word: "Horizon",    category: "voyage" },
  { word: "Frontière",  category: "voyage" },
  { word: "Retard",     category: "voyage" },
  { word: "Décalage",   category: "voyage" },
  { word: "Terminal",   category: "voyage" },
  { word: "Itinéraire", category: "voyage" },

  // Quotidien (12)
  { word: "Réveil",       category: "quotidien" },
  { word: "Café",         category: "quotidien" },
  { word: "Embouteillage",category: "quotidien" },
  { word: "Clés",         category: "quotidien" },
  { word: "Parapluie",    category: "quotidien" },
  { word: "Monnaie",      category: "quotidien" },
  { word: "File",         category: "quotidien" },
  { word: "Voisin",       category: "quotidien" },
  { word: "Ascenseur",    category: "quotidien" },
  { word: "Sonnette",     category: "quotidien" },
  { word: "Reçu",         category: "quotidien" },
  { word: "Miettes",      category: "quotidien" },

  // Abstrait (12)
  { word: "Hasard",    category: "abstrait" },
  { word: "Silence",   category: "abstrait" },
  { word: "Équilibre", category: "abstrait" },
  { word: "Rythme",    category: "abstrait" },
  { word: "Tension",   category: "abstrait" },
  { word: "Lumière",   category: "abstrait" },
  { word: "Poids",     category: "abstrait" },
  { word: "Vitesse",   category: "abstrait" },
  { word: "Couleur",   category: "abstrait" },
  { word: "Vide",      category: "abstrait" },
  { word: "Écho",      category: "abstrait" },
  { word: "Limite",    category: "abstrait" },

  // Bureau (12)
  { word: "Réunion",      category: "bureau" },
  { word: "Agenda",       category: "bureau" },
  { word: "Deadline",     category: "bureau" },
  { word: "Post-it",      category: "bureau" },
  { word: "Présentation", category: "bureau" },
  { word: "Tableau",      category: "bureau" },
  { word: "Imprimante",   category: "bureau" },
  { word: "Badge",        category: "bureau" },
  { word: "Couloir",      category: "bureau" },
  { word: "Cantine",      category: "bureau" },
  { word: "Version",      category: "bureau" },
  { word: "Validation",   category: "bureau" },
];

export function pickRandomStarterWord(category?: StarterWord["category"]): string {
  const pool = category
    ? STARTER_WORDS.filter((w) => w.category === category)
    : STARTER_WORDS;
  return pool[Math.floor(Math.random() * pool.length)].word;
}
