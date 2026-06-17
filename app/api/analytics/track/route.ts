import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

// Force Node.js Lambda — empêche Vercel Edge de cacher la réponse
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Paths to ignore
const IGNORED_PREFIXES = ["/admin", "/api", "/login", "/signup", "/onboarding",
  "/verify-email", "/email-confirmed", "/reset-password", "/icon.svg"];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const { path, referrer, sessionId } = await req.json() as {
      path: string;
      referrer?: string;
      sessionId: string;
    };

    if (!path || !sessionId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Validate path format and length
    if (typeof path !== "string" || !path.startsWith("/") || path.length > 500) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Validate sessionId is a proper UUID
    if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const NO_CACHE = { headers: { "Cache-Control": "no-store" } };

    // Skip internal paths
    if (IGNORED_PREFIXES.some((p) => path.startsWith(p))) {
      console.log("[analytics/track] filtered:", path);
      return NextResponse.json({ ok: true }, NO_CACHE);
    }

    console.log("[analytics/track] tracking:", path);

    // Récupère l'user_id depuis la session si connecté
    let userId: string | null = null;
    try {
      const supabase = createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // auth failure is non-blocking — track anonymously
    }

    const admin = createAdminSupabaseClient();
    const { error: insertError } = await admin.from("analytics_events").insert({
      path,
      referrer: typeof referrer === "string" ? referrer.slice(0, 500) : null,
      session_id: sessionId,
      user_id: userId,
    });

    if (insertError) {
      console.error("[analytics/track] insert failed:", insertError.message, insertError.code);
      return NextResponse.json({ ok: false }, { ...NO_CACHE, status: 500 });
    }

    console.log("[analytics/track] inserted ok:", path);
    return NextResponse.json({ ok: true }, NO_CACHE);
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
