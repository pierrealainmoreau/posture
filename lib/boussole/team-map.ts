import type { ProfilId } from './profiles';
import { PROFIL_ORDER } from './profiles';
import type { BoussoleScoringResult } from './scoring';
import { getTeamInsight } from './team-insights';

export type TeamMap = {
  distribution: Record<ProfilId, number>;
  dominant: ProfilId;
  absent: ProfilId[];
  insight: string;
};

export function computeTeamMap(results: BoussoleScoringResult[]): TeamMap {
  const total = results.length;

  const counts: Record<ProfilId, number> = {
    pilote: 0,
    dynamo: 0,
    socle: 0,
    repere: 0,
  };

  for (const result of results) {
    counts[result.primaryProfile] += 1;
  }

  const distribution: Record<ProfilId, number> = {
    pilote: total > 0 ? Math.round((counts.pilote / total) * 100) : 0,
    dynamo: total > 0 ? Math.round((counts.dynamo / total) * 100) : 0,
    socle: total > 0 ? Math.round((counts.socle / total) * 100) : 0,
    repere: total > 0 ? Math.round((counts.repere / total) * 100) : 0,
  };

  // dominant = profil with highest distribution, PROFIL_ORDER as tiebreaker
  const dominant = (Object.keys(distribution) as ProfilId[]).sort((a, b) => {
    const diff = distribution[b] - distribution[a];
    if (diff !== 0) return diff;
    return PROFIL_ORDER.indexOf(a) - PROFIL_ORDER.indexOf(b);
  })[0];

  const absent = PROFIL_ORDER.filter((p) => distribution[p] === 0);

  const insight = getTeamInsight(dominant, absent);

  return { distribution, dominant, absent, insight };
}
