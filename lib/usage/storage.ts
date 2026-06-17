const STORAGE_KEY = "posture-usage-v2";

export interface ToolUsageEntry {
  count: number;
  firstUsedAt: number;
  lastUsedAt: number;
}

export interface UsageData {
  userId?: string;
  tools: Record<string, ToolUsageEntry>;
}

const DEFAULT: UsageData = { tools: {} };

export function loadUsage(): UsageData {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UsageData) : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

// Retourne les données uniquement si elles appartiennent à cet utilisateur.
// Réinitialise silencieusement si un autre userId est détecté (multi-compte sur même navigateur).
export function loadUsageForUser(userId: string): UsageData {
  const data = loadUsage();
  if (data.userId && data.userId !== userId) {
    const fresh: UsageData = { userId, tools: {} };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
  return data;
}

export function trackUsage(toolId: string, userId?: string): void {
  if (typeof window === "undefined") return;
  const current = loadUsage();

  // Réinitialise si le userId stocké ne correspond pas
  const base: UsageData =
    userId && current.userId && current.userId !== userId
      ? { userId, tools: {} }
      : { ...current, userId: userId ?? current.userId };

  const existing = base.tools[toolId];
  const now = Date.now();
  const next: UsageData = {
    ...base,
    tools: {
      ...base.tools,
      [toolId]: {
        count: (existing?.count ?? 0) + 1,
        firstUsedAt: existing?.firstUsedAt ?? now,
        lastUsedAt: now,
      },
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
