export interface McUser {
  firstName: string;
  lastName: string;
  email: string;
}

const KEY = "mc_user";

export function getUser(): McUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as McUser;
  } catch {
    return null;
  }
}

export function saveUser(user: McUser): void {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(KEY);
}
