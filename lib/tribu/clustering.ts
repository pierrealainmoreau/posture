export type PlayerAnswers = {
  playerId: string;
  answers: Record<string, string>; // questionId → chosen value
};

export type ClusteredTribe = {
  id: string;
  playerIds: string[];
  similarityScore: number; // average internal similarity
};

function similarity(a: PlayerAnswers, b: PlayerAnswers): number {
  const common = Object.keys(a.answers).filter((q) => b.answers[q] !== undefined);
  if (common.length === 0) return 0;
  const matches = common.filter((q) => a.answers[q] === b.answers[q]);
  return matches.length / common.length;
}

function clusterWithThreshold(
  players: PlayerAnswers[],
  threshold: number,
  maxTribeSize: number
): ClusteredTribe[] | null {
  const assignment: Record<string, string> = {}; // playerId → tribeId
  let tribeCounter = 0;

  // Sort all pairs by similarity descending
  const pairs: Array<{ a: string; b: string; sim: number }> = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      pairs.push({
        a: players[i].playerId,
        b: players[j].playerId,
        sim: similarity(players[i], players[j]),
      });
    }
  }
  pairs.sort((x, y) => y.sim - x.sim);

  for (const { a, b, sim } of pairs) {
    if (sim < threshold) break;

    const tribeA = assignment[a];
    const tribeB = assignment[b];

    if (!tribeA && !tribeB) {
      const tid = `tribe-${tribeCounter++}`;
      assignment[a] = tid;
      assignment[b] = tid;
    } else if (tribeA && !tribeB) {
      const size = Object.values(assignment).filter((t) => t === tribeA).length;
      if (size < maxTribeSize) assignment[b] = tribeA;
    } else if (!tribeA && tribeB) {
      const size = Object.values(assignment).filter((t) => t === tribeB).length;
      if (size < maxTribeSize) assignment[a] = tribeB;
    }
    // if both already assigned and same tribe, skip; if different, skip (don't merge)
  }

  // Assign isolated players to their own tribe
  for (const p of players) {
    if (!assignment[p.playerId]) {
      assignment[p.playerId] = `tribe-${tribeCounter++}`;
    }
  }

  // Build ClusteredTribe objects
  const tribeMap: Record<string, string[]> = {};
  for (const [pid, tid] of Object.entries(assignment)) {
    if (!tribeMap[tid]) tribeMap[tid] = [];
    tribeMap[tid].push(pid);
  }

  const tribes: ClusteredTribe[] = Object.entries(tribeMap).map(([tid, pids]) => {
    let totalSim = 0;
    let count = 0;
    for (let i = 0; i < pids.length; i++) {
      for (let j = i + 1; j < pids.length; j++) {
        const pa = players.find((p) => p.playerId === pids[i])!;
        const pb = players.find((p) => p.playerId === pids[j])!;
        totalSim += similarity(pa, pb);
        count++;
      }
    }
    return {
      id: tid,
      playerIds: pids,
      similarityScore: count > 0 ? Math.round((totalSim / count) * 100) : 100,
    };
  });

  // Reject if one tribe absorbs more than N/2 players (unless only 1 or 2 players total)
  if (players.length > 2) {
    const maxAllowed = Math.ceil(players.length / 2);
    if (tribes.some((t) => t.playerIds.length > maxAllowed)) return null;
  }

  return tribes;
}

export function clusterPlayers(players: PlayerAnswers[]): ClusteredTribe[] {
  if (players.length === 0) return [];
  if (players.length === 1) {
    return [{ id: "tribe-0", playerIds: [players[0].playerId], similarityScore: 100 }];
  }

  const maxTribeSize = Math.ceil(players.length / 2);

  for (const threshold of [0.65, 0.50, 0.40]) {
    const result = clusterWithThreshold(players, threshold, maxTribeSize);
    if (result) return result;
  }

  // Fallback: everyone in their own tribe
  return players.map((p, i) => ({
    id: `tribe-${i}`,
    playerIds: [p.playerId],
    similarityScore: 100,
  }));
}
