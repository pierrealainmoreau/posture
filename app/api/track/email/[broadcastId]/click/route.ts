import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyTrackingToken } from "@/lib/email";

export async function GET(
  req: NextRequest,
  { params }: { params: { broadcastId: string } },
) {
  const rawUrl = req.nextUrl.searchParams.get("url") ?? "";
  const userId = req.nextUrl.searchParams.get("u") ?? "";
  const sig = req.nextUrl.searchParams.get("s") ?? "";

  // Validate — only allow http/https redirects
  let destination = "https://posture.pamoreau.xyz";
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      destination = rawUrl;
    }
  } catch { /* invalid URL */ }

  // Fire-and-forget
  try {
    const admin = createAdminSupabaseClient();
    await admin.rpc("increment_email_stat", { p_id: params.broadcastId, p_col: "clicks" });
    if (userId && sig && verifyTrackingToken(params.broadcastId, userId, sig)) {
      await admin.rpc("record_email_click", { p_broadcast_id: params.broadcastId, p_user_id: userId });
    }
  } catch { /* table or function may not exist yet */ }

  return NextResponse.redirect(destination, { status: 302 });
}
