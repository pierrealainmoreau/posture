export function computeGuesserPoints(
  timeRemaining: number,
  totalDuration: number,
  guessPosition: number
): number {
  const timeScore = totalDuration > 0
    ? Math.round(100 * (timeRemaining / totalDuration))
    : 0;
  const bonusPosition =
    guessPosition === 1 ? 50 : guessPosition === 2 ? 30 : guessPosition === 3 ? 20 : 0;
  return Math.max(10, timeScore) + bonusPosition;
}

export function computeDrawerPoints(
  correctGuessers: number,
  totalPlayers: number
): number {
  if (correctGuessers === 0 || totalPlayers <= 1) return 0;
  return Math.min(100, Math.round((50 * correctGuessers) / (totalPlayers - 1)));
}
