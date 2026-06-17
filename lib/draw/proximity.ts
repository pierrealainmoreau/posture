export type GuessProximity = "correct" | "typo" | "close" | "far";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

export function computeProximity(guess: string, word: string): GuessProximity {
  const a = normalize(guess);
  const b = normalize(word);
  if (a === b) return "correct";
  const dist = levenshtein(a, b);
  if (dist <= 2) return "typo";
  if (dist <= Math.max(3, Math.floor(b.length * 0.35))) return "close";
  return "far";
}
