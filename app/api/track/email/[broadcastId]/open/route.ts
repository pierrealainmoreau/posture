import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyTrackingToken } from "@/lib/email";

// 1×1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(
  req: NextRequest,
  { params }: { params: { broadcastId: string } },
) {
  const userId = req.nextUrl.searchParams.get("u") ?? "";
  const sig = req.nextUrl.searchParams.get("s") ?? "";

  try {
    const admin = createAdminSupabaseClient();
    await admin.rpc("increment_email_stat", { p_id: params.broadcastId, p_col: "opens" });
    if (userId && sig && verifyTrackingToken(params.broadcastId, userId, sig)) {
      await admin.rpc("record_email_open", { p_broadcast_id: params.broadcastId, p_user_id: userId });
    }
  } catch { /* table or function may not exist yet */ }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
