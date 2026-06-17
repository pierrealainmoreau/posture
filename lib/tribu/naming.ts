import type { PlayerAnswers } from "./clustering";
import type { ClusteredTribe } from "./clustering";
import { TRIBE_PROFILES } from "./tribe-names";
import { getQuestionById } from "./questions";
import type { Tribe } from "./types";

function dominantTrait(tribePlayerIds: string[], allAnswers: PlayerAnswers[], questionId: string): string | null {
  const relevant = allAnswers.filter(
    (pa) => tribePlayerIds.includes(pa.playerId) && pa.answers[questionId] !== undefined
  );
  if (relevant.length === 0) return null;

  const tally: Record<string, number> = {};
  for (const pa of relevant) {
    const v = pa.answers[questionId];
    tally[v] = (tally[v] ?? 0) + 1;
  }
  return Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
}

function getSignatureAnswers(
  tribePlayerIds: string[],
  allAnswers: PlayerAnswers[]
): Array<{ questionId: string; value: string; label: string }> {
  // Questions where 100% of tribe members who answered agree
  const allQids = new Set<string>();
  for (const pa of allAnswers) {
    if (tribePlayerIds.includes(pa.playerId)) {
      Object.keys(pa.answers).forEach((q) => allQids.add(q));
    }
  }

  const signatures: Array<{ questionId: string; value: string; label: string }> = [];
  for (const qid of allQids) {
    const members = allAnswers.filter(
      (pa) => tribePlayerIds.includes(pa.playerId) && pa.answers[qid] !== undefined
    );
    if (members.length < tribePlayerIds.length) continue; // not everyone answered
    const firstVal = members[0].answers[qid];
    if (members.every((pa) => pa.answers[qid] === firstVal)) {
      const q = getQuestionById(qid);
      const choice = q?.choices.find((c) => c.value === firstVal);
      if (q && choice) {
        signatures.push({ questionId: qid, value: firstVal, label: choice.label });
      }
    }
    if (signatures.length >= 3) break;
  }
  return signatures;
}

export function assignTribes(
  clusters: ClusteredTribe[],
  allAnswers: PlayerAnswers[]
): Tribe[] {
  const usedProfileIds = new Set<string>();

  return clusters.map((cluster, idx) => {
    // Collect dominant trait from each question for this tribe
    const tribeTraits: string[] = [];
    const allQids = new Set<string>();
    for (const pa of allAnswers) {
      if (cluster.playerIds.includes(pa.playerId)) {
        Object.keys(pa.answers).forEach((q) => allQids.add(q));
      }
    }

    for (const qid of allQids) {
      const dominant = dominantTrait(cluster.playerIds, allAnswers, qid);
      if (dominant !== null) {
        const q = getQuestionById(qid);
        const choice = q?.choices.find((c) => c.value === dominant);
        if (choice?.trait) tribeTraits.push(choice.trait);
      }
    }

    // Score each profile
    const scored = TRIBE_PROFILES.filter((p) => !usedProfileIds.has(p.id))
      .map((profile) => ({
        profile,
        score: profile.traits.filter((t) => tribeTraits.includes(t)).length,
      }))
      .sort((a, b) => b.score - a.score);

    const chosen = scored[0]?.profile ?? TRIBE_PROFILES[idx % TRIBE_PROFILES.length];
    usedProfileIds.add(chosen.id);

    const signatureAnswers = getSignatureAnswers(cluster.playerIds, allAnswers);

    return {
      id: cluster.id,
      playerIds: cluster.playerIds,
      profileId: chosen.id,
      similarityScore: cluster.similarityScore,
      signatureAnswers,
    };
  });
}
