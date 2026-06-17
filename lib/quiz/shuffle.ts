/**
 * Algorithme de Fisher-Yates pour mélanger un tableau de manière équitable.
 */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Tire N éléments aléatoirement d'un tableau, sans remise.
 */
export function pickRandom<T>(array: readonly T[], count: number): T[] {
  return shuffle(array).slice(0, count);
}
