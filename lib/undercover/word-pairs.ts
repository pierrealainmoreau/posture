export interface WordPair {
  civil: string;
  undercover: string;
  category: string;
}

export const WORD_PAIRS: WordPair[] = [
  // Animaux
  { civil: "chat", undercover: "chien", category: "animaux" },
  { civil: "lion", undercover: "tigre", category: "animaux" },
  { civil: "dauphin", undercover: "baleine", category: "animaux" },
  { civil: "aigle", undercover: "faucon", category: "animaux" },
  { civil: "lapin", undercover: "lièvre", category: "animaux" },
  { civil: "mouton", undercover: "chèvre", category: "animaux" },
  { civil: "cheval", undercover: "âne", category: "animaux" },
  { civil: "loup", undercover: "renard", category: "animaux" },
  { civil: "ours", undercover: "panda", category: "animaux" },
  { civil: "grenouille", undercover: "crapaud", category: "animaux" },
  { civil: "crocodile", undercover: "alligator", category: "animaux" },
  { civil: "perroquet", undercover: "perruche", category: "animaux" },
  { civil: "pieuvre", undercover: "méduse", category: "animaux" },
  { civil: "corbeau", undercover: "pie", category: "animaux" },
  // Alimentation
  { civil: "café", undercover: "thé", category: "alimentation" },
  { civil: "pizza", undercover: "quiche", category: "alimentation" },
  { civil: "beurre", undercover: "margarine", category: "alimentation" },
  { civil: "baguette", undercover: "croissant", category: "alimentation" },
  { civil: "fraise", undercover: "framboise", category: "alimentation" },
  { civil: "pomme", undercover: "poire", category: "alimentation" },
  { civil: "orange", undercover: "clémentine", category: "alimentation" },
  { civil: "chocolat", undercover: "caramel", category: "alimentation" },
  { civil: "vin", undercover: "bière", category: "alimentation" },
  { civil: "glace", undercover: "sorbet", category: "alimentation" },
  { civil: "tarte", undercover: "gâteau", category: "alimentation" },
  { civil: "fromage", undercover: "yaourt", category: "alimentation" },
  { civil: "citron", undercover: "lime", category: "alimentation" },
  { civil: "jambon", undercover: "saucisson", category: "alimentation" },
  { civil: "miel", undercover: "confiture", category: "alimentation" },
  // Transport
  { civil: "voiture", undercover: "moto", category: "transport" },
  { civil: "avion", undercover: "hélicoptère", category: "transport" },
  { civil: "bateau", undercover: "sous-marin", category: "transport" },
  { civil: "vélo", undercover: "trottinette", category: "transport" },
  { civil: "train", undercover: "métro", category: "transport" },
  { civil: "bus", undercover: "tramway", category: "transport" },
  { civil: "fusée", undercover: "navette", category: "transport" },
  // Sport
  { civil: "tennis", undercover: "badminton", category: "sport" },
  { civil: "football", undercover: "rugby", category: "sport" },
  { civil: "natation", undercover: "plongée", category: "sport" },
  { civil: "ski", undercover: "snowboard", category: "sport" },
  { civil: "judo", undercover: "karaté", category: "sport" },
  { civil: "golf", undercover: "pétanque", category: "sport" },
  { civil: "boxe", undercover: "lutte", category: "sport" },
  { civil: "cyclisme", undercover: "triathlon", category: "sport" },
  { civil: "escalade", undercover: "randonnée", category: "sport" },
  { civil: "yoga", undercover: "pilates", category: "sport" },
  // Lieux
  { civil: "plage", undercover: "piscine", category: "lieux" },
  { civil: "forêt", undercover: "jungle", category: "lieux" },
  { civil: "montagne", undercover: "colline", category: "lieux" },
  { civil: "désert", undercover: "savane", category: "lieux" },
  { civil: "château", undercover: "palais", category: "lieux" },
  { civil: "cathédrale", undercover: "mosquée", category: "lieux" },
  { civil: "cinéma", undercover: "théâtre", category: "lieux" },
  { civil: "musée", undercover: "galerie", category: "lieux" },
  { civil: "hôpital", undercover: "clinique", category: "lieux" },
  { civil: "école", undercover: "université", category: "lieux" },
  { civil: "jardin", undercover: "parc", category: "lieux" },
  { civil: "phare", undercover: "tour", category: "lieux" },
  // Nature
  { civil: "rivière", undercover: "fleuve", category: "nature" },
  { civil: "lac", undercover: "étang", category: "nature" },
  { civil: "soleil", undercover: "lune", category: "nature" },
  { civil: "étoile", undercover: "planète", category: "nature" },
  { civil: "nuage", undercover: "brouillard", category: "nature" },
  { civil: "pluie", undercover: "neige", category: "nature" },
  { civil: "volcan", undercover: "geyser", category: "nature" },
  { civil: "arbre", undercover: "arbuste", category: "nature" },
  { civil: "falaise", undercover: "grotte", category: "nature" },
  { civil: "orage", undercover: "tempête", category: "nature" },
  // Objets
  { civil: "stylo", undercover: "crayon", category: "objets" },
  { civil: "téléphone", undercover: "tablette", category: "objets" },
  { civil: "livre", undercover: "magazine", category: "objets" },
  { civil: "verre", undercover: "tasse", category: "objets" },
  { civil: "couteau", undercover: "fourchette", category: "objets" },
  { civil: "sac", undercover: "valise", category: "objets" },
  { civil: "montre", undercover: "horloge", category: "objets" },
  { civil: "lampe", undercover: "bougie", category: "objets" },
  { civil: "clé", undercover: "cadenas", category: "objets" },
  { civil: "miroir", undercover: "vitre", category: "objets" },
  { civil: "lit", undercover: "canapé", category: "objets" },
  { civil: "chaise", undercover: "tabouret", category: "objets" },
  // Métiers
  { civil: "médecin", undercover: "infirmier", category: "métiers" },
  { civil: "avocat", undercover: "juge", category: "métiers" },
  { civil: "professeur", undercover: "instituteur", category: "métiers" },
  { civil: "cuisinier", undercover: "boulanger", category: "métiers" },
  { civil: "pompier", undercover: "policier", category: "métiers" },
  { civil: "pilote", undercover: "navigateur", category: "métiers" },
  { civil: "architecte", undercover: "ingénieur", category: "métiers" },
  { civil: "acteur", undercover: "chanteur", category: "métiers" },
  { civil: "photographe", undercover: "cameraman", category: "métiers" },
  // Abstrait
  { civil: "amour", undercover: "amitié", category: "abstrait" },
  { civil: "liberté", undercover: "égalité", category: "abstrait" },
  { civil: "joie", undercover: "bonheur", category: "abstrait" },
  { civil: "rêve", undercover: "espoir", category: "abstrait" },
  { civil: "courage", undercover: "audace", category: "abstrait" },
  { civil: "vérité", undercover: "honnêteté", category: "abstrait" },
  { civil: "patience", undercover: "sagesse", category: "abstrait" },
  { civil: "silence", undercover: "calme", category: "abstrait" },
  { civil: "hasard", undercover: "destin", category: "abstrait" },
];

const RECENT_PAIRS_WINDOW = 20;

export async function pickWordPair(recentIndices: number[]): Promise<{ pair: WordPair; index: number }> {
  const available = WORD_PAIRS
    .map((pair, index) => ({ pair, index }))
    .filter(({ index }) => !recentIndices.includes(index));

  const pool = available.length > 0 ? available : WORD_PAIRS.map((pair, index) => ({ pair, index }));
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return chosen;
}

export { RECENT_PAIRS_WINDOW };
