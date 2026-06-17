import type { ProfilId } from './profiles';
import { PROFIL_ORDER } from './profiles';

export type SituationAnswer = {
  situationId: string;
  choiceValue: ProfilId | null;
};

export type BoussoleScoringResult = {
  playerId: string;
  scores: Record<ProfilId, number>;
  primaryProfile: ProfilId;
  secondaryProfile: ProfilId;
};

export function computeScores(answers: SituationAnswer[]): Record<ProfilId, number> {
  const counts: Record<ProfilId, number> = {
    pilote: 0,
    dynamo: 0,
    socle: 0,
    repere: 0,
  };

  const validAnswers = answers.filter((a) => a.choiceValue !== null);
  const total = validAnswers.length;

  if (total === 0) {
    return { pilote: 25, dynamo: 25, socle: 25, repere: 25 };
  }

  for (const answer of validAnswers) {
    counts[answer.choiceValue as ProfilId] += 1;
  }

  return {
    pilote: Math.round((counts.pilote / total) * 100),
    dynamo: Math.round((counts.dynamo / total) * 100),
    socle: Math.round((counts.socle / total) * 100),
    repere: Math.round((counts.repere / total) * 100),
  };
}

export function computePlayerResult(
  playerId: string,
  answers: SituationAnswer[]
): BoussoleScoringResult {
  const scores = computeScores(answers);

  // Sort by score descending, with PROFIL_ORDER as tiebreaker
  const sorted = (Object.keys(scores) as ProfilId[]).sort((a, b) => {
    const diff = scores[b] - scores[a];
    if (diff !== 0) return diff;
    return PROFIL_ORDER.indexOf(a) - PROFIL_ORDER.indexOf(b);
  });

  return {
    playerId,
    scores,
    primaryProfile: sorted[0],
    secondaryProfile: sorted[1],
  };
}
