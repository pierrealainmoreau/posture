import type { SupabaseClient } from "@supabase/supabase-js";

export const USER_REQUEST_LIMIT = 5;
export const PREMIUM_REQUEST_LIMIT = 25;
export const ADMIN_REQUEST_LIMIT = 50;
export const DEFAULT_REQUEST_LIMIT = USER_REQUEST_LIMIT;
export const REQUEST_LIMIT = DEFAULT_REQUEST_LIMIT;
export type Tool =
  | "feedback" | "interview" | "recruitment" | "job-description" | "teams" | "reunion-maker"
  | "icebreaker" | "chaine" | "humeur" | "boussole" | "tribu" | "draw" | "tvml"
  | "okr" | "abcde" | "search" | "emoji_only" | "synthese";

export function limitForRole(role: string | null | undefined): number {
  if (role === "admin") return ADMIN_REQUEST_LIMIT;
  if (role === "premium") return PREMIUM_REQUEST_LIMIT;
  return USER_REQUEST_LIMIT;
}

export async function checkRateLimit(
  userId: string,
  supabase: SupabaseClient,
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const limit = limitForRole(profile?.role);

  const { count } = await supabase
    .from("usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const total = count ?? 0;
  return { allowed: total < limit, count: total, limit };
}

export async function recordUsage(
  userId: string,
  tool: Tool,
  supabase: SupabaseClient,
): Promise<void> {
  await supabase.from("usage").insert({ user_id: userId, tool });
}
