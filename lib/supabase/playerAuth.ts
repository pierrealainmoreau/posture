import { randomBytes } from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";

export function generatePlayerSecret(): string {
  return randomBytes(32).toString("hex");
}

export async function verifyPlayerSecret(
  admin: SupabaseClient,
  table: string,
  playerId: string,
  secret: string | null
): Promise<boolean> {
  if (!playerId || !secret) return false;
  const { data } = await admin
    .from(table)
    .select("player_secret")
    .eq("id", playerId)
    .single();
  return !!data && data.player_secret === secret;
}
