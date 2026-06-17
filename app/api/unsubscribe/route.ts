import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyUnsubscribeSignature } from "@/lib/email";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://posture.pamoreau.xyz";
  const userId = req.nextUrl.searchParams.get("u") ?? "";
  const sig = req.nextUrl.searchParams.get("s") ?? "";

  if (!userId || !sig || !verifyUnsubscribeSignature(userId, sig)) {
    return NextResponse.redirect(new URL("/", appUrl));
  }

  try {
    const admin = createAdminSupabaseClient();
    await admin
      .from("profiles")
      .update({ newsletter_opt_in: false, unsubscribed_at: new Date().toISOString() })
      .eq("id", userId);
  } catch { /* noop */ }

  const dest = new URL("/unsubscribe", appUrl);
  dest.searchParams.set("u", userId);
  dest.searchParams.set("s", sig);
  return NextResponse.redirect(dest);
}
