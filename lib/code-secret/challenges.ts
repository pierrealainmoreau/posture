import type { Difficulty } from './types';

export interface Challenge {
  id: string;
  title: string;
  difficulty: Difficulty;
  timeLimitSeconds: number;
  maxHints: number;
  hintPenalty: number;
  wrongGuessPenalty: number;
  encodedMessage: string;
  answer: string;
  hints: string[];
  cipherDescription: string;
}

// All answers are uppercase, accent-free for comparison
export const CHALLENGES: Challenge[] = [
  // ─── FACILE — 10 min, 4 indices, -150 pts/indice ──────────────────────────
  {
    id: 'e1-positions',
    title: 'Le chiffre des positions',
    difficulty: 'easy',
    timeLimitSeconds: 600,
    maxHints: 4,
    hintPenalty: 150,
    wrongGuessPenalty: 50,
    encodedMessage: '02 · 18 · 01 · 22 · 15',
    answer: 'BRAVO',
    cipherDescription: 'Substitution numérique A=01…Z=26',
    hints: [
      'Chaque nombre correspond à une lettre de l\'alphabet.',
      'L\'alphabet commence à 01 : A=01, B=02, C=03…',
      'Il y a 5 nombres, donc 5 lettres à trouver.',
      'La réponse est un mot d\'encouragement qu\'on crie après une bonne performance.',
    ],
  },
  {
    id: 'e2-atbash',
    title: 'L\'alphabet miroir',
    difficulty: 'easy',
    timeLimitSeconds: 600,
    maxHints: 4,
    hintPenalty: 150,
    wrongGuessPenalty: 50,
    encodedMessage: 'GVZN HKRIRG',
    answer: 'TEAM SPIRIT',
    cipherDescription: 'Atbash — A↔Z, B↔Y, C↔X…',
    hints: [
      'Chaque lettre a été remplacée par une autre lettre de l\'alphabet.',
      'L\'alphabet a été retourné de bout en bout.',
      'A devient Z, B devient Y, C devient X, et ainsi de suite.',
      'La réponse est une expression anglaise très utilisée en management.',
    ],
  },
  {
    id: 'e3-cesar3',
    title: 'Le code César',
    difficulty: 'easy',
    timeLimitSeconds: 600,
    maxHints: 4,
    hintPenalty: 150,
    wrongGuessPenalty: 50,
    encodedMessage: 'FROODERUDWLRQ',
    answer: 'COLLABORATION',
    cipherDescription: 'César +3 — A→D, B→E, C→F…',
    hints: [
      'Chaque lettre a été décalée d\'un certain nombre de positions vers l\'avant dans l\'alphabet.',
      'Le décalage est le même pour toutes les lettres.',
      'Si A devient D, de combien de positions s\'est-on décalé ? Appliquez le décalage inverse.',
      'La réponse est une valeur fondamentale du travail en équipe.',
    ],
  },

  // ─── MOYEN — 7 min, 3 indices, -200 pts/indice ────────────────────────────
  {
    id: 'm1-morse',
    title: 'Le code Morse',
    difficulty: 'medium',
    timeLimitSeconds: 420,
    maxHints: 3,
    hintPenalty: 200,
    wrongGuessPenalty: 50,
    encodedMessage: '-.-. --- -. ..-. .. .- -. -.-. .',
    answer: 'CONFIANCE',
    cipherDescription: 'Morse — points (.) et tirets (-), lettres séparées par des espaces',
    hints: [
      'Chaque groupe séparé par un espace représente une lettre.',
      'Ce système de codage utilise des points (.) et des tirets (-) — inventé pour les télégraphes au XIXe siècle.',
      'Cherchez "alphabet Morse" pour trouver la table de correspondance complète.',
    ],
  },
  {
    id: 'm2-polybe',
    title: 'Le carré de Polybe',
    difficulty: 'medium',
    timeLimitSeconds: 420,
    maxHints: 3,
    hintPenalty: 200,
    wrongGuessPenalty: 50,
    encodedMessage: '24 33 33 34 51 11 44 24 34 33',
    answer: 'INNOVATION',
    cipherDescription: 'Carré de Polybe 5×5 — coordonnées (ligne, colonne)',
    hints: [
      'Chaque paire de chiffres correspond à une position dans une grille 5×5.',
      'Le premier chiffre est la ligne, le second est la colonne de la grille.',
      'La ligne 1 contient les lettres A à E : A=11, B=12, C=13, D=14, E=15. La ligne 2 : F=21, G=22, H=23, I=24, K=25.',
    ],
  },
  {
    id: 'm3-premiers',
    title: 'Le code des premiers',
    difficulty: 'medium',
    timeLimitSeconds: 420,
    maxHints: 3,
    hintPenalty: 200,
    wrongGuessPenalty: 50,
    encodedMessage: '37 · 11 · 2 · 7 · 11 · 61 · 67 · 19 · 23 · 53',
    answer: 'LEADERSHIP',
    cipherDescription: 'Nombres premiers — A=2e(1er), B=3(2e), C=5(3e)…',
    hints: [
      'Chaque nombre correspond à une lettre selon une règle mathématique particulière.',
      'Tous ces nombres sont des nombres premiers (2, 3, 5, 7, 11, 13, 17, 19, 23…).',
      'A correspond au 1er nombre premier (2), B au 2e (3), C au 3e (5), D au 4e (7), E au 5e (11)…',
    ],
  },

  // ─── DIFFICILE — 5 min, 2 indices, -300 pts/indice ────────────────────────
  {
    id: 'h1-ascii',
    title: 'Le code ASCII',
    difficulty: 'hard',
    timeLimitSeconds: 300,
    maxHints: 2,
    hintPenalty: 300,
    wrongGuessPenalty: 50,
    encodedMessage: '66 73 69 78 86 69 73 76 76 65 78 67 69',
    answer: 'BIENVEILLANCE',
    cipherDescription: 'ASCII décimal — A=65, B=66…',
    hints: [
      'Chaque nombre représente un caractère selon le standard informatique le plus répandu au monde.',
      'Les majuscules commencent à 65 dans ce système : A=65, B=66, C=67, D=68…',
    ],
  },
  {
    id: 'h2-vigenere',
    title: 'Le chiffre de Vigenère',
    difficulty: 'hard',
    timeLimitSeconds: 300,
    maxHints: 2,
    hintPenalty: 300,
    wrongGuessPenalty: 50,
    encodedMessage: 'PIVTWV',
    answer: 'AUDACE',
    cipherDescription: 'Vigenère — clé secrète, chaque lettre décalée différemment',
    hints: [
      'Chaque lettre a été décalée d\'un nombre de positions différent selon sa position dans le message — c\'est un chiffre de Vigenère.',
      'La clé de chiffrement est le nom de l\'outil dans lequel vous jouez en ce moment.',
    ],
  },
  {
    id: 'h3-double',
    title: 'Le double chiffrement',
    difficulty: 'hard',
    timeLimitSeconds: 300,
    maxHints: 2,
    hintPenalty: 300,
    wrongGuessPenalty: 50,
    encodedMessage: 'KXJTQTXOZX',
    answer: 'RESILIENCE',
    cipherDescription: 'Atbash puis César +2 — deux opérations successives',
    hints: [
      'Ce message a été chiffré en deux étapes successives avec deux méthodes différentes.',
      'Étape 1 : l\'alphabet a été inversé (A→Z, B→Y, Z→A…). Étape 2 : chaque lettre a ensuite été décalée de 2 positions vers l\'avant dans l\'alphabet.',
    ],
  },
];

const BY_DIFFICULTY: Record<Difficulty, Challenge[]> = {
  easy:   CHALLENGES.filter(c => c.difficulty === 'easy'),
  medium: CHALLENGES.filter(c => c.difficulty === 'medium'),
  hard:   CHALLENGES.filter(c => c.difficulty === 'hard'),
};

export function getRandomChallenge(difficulty: Difficulty): Challenge {
  const pool = BY_DIFFICULTY[difficulty];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getChallengeById(id: string): Challenge | undefined {
  return CHALLENGES.find(c => c.id === id);
}

export function normalizeAnswer(raw: string): string {
  return raw.trim().toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}
