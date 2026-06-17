import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_CACHE = { headers: { "Cache-Control": "no-store" } };

export async function GET() {
  // Auth check — admin only
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const admin = createAdminSupabaseClient();

  const now = new Date();
  const d7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all events for last 30 days (path, session_id, created_at)
  const { data: events30, error } = await admin
    .from("analytics_events")
    .select("path, session_id, created_at, user_id")
    .gte("created_at", d30)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const events = events30 ?? [];

  // ── Split by period ───────────────────────────────────────────────────────
  // Use Date objects to avoid ISO string format mismatch (Z vs +00:00)
  const d7Date = new Date(d7);
  const events7 = events.filter((e) => new Date(e.created_at) >= d7Date);

  // ── Page views ────────────────────────────────────────────────────────────
  const views30d = events.length;
  const views7d  = events7.length;

  // ── Sessions (total visits = distinct session_ids) ────────────────────────
  const sessions30d = new Set(events.map((e)  => e.session_id)).size;
  const sessions7d  = new Set(events7.map((e) => e.session_id)).size;

  // ── Unique visitors (MAU / WAU) ───────────────────────────────────────────
  // Logged-in users counted by user_id (persistent across sessions).
  // Anonymous users counted by session_id (no persistent identifier available).
  function countUniqueVisitors(evts: typeof events): number {
    const userIds   = new Set<string>();
    const anonSids  = new Set<string>();
    for (const e of evts) {
      const uid = (e as { user_id?: string | null }).user_id;
      if (uid) {
        userIds.add(uid);
      } else {
        anonSids.add(e.session_id);
      }
    }
    return userIds.size + anonSids.size;
  }

  const mau = countUniqueVisitors(events);
  const wau = countUniqueVisitors(events7);

  // ── Bounce rate (sessions with only 1 page view in 30d) ──────────────────
  const sessionCounts = new Map<string, number>();
  for (const e of events) {
    sessionCounts.set(e.session_id, (sessionCounts.get(e.session_id) ?? 0) + 1);
  }
  const singlePageSessions = [...sessionCounts.values()].filter((c) => c === 1).length;
  const bounceRate = sessions30d > 0
    ? Math.round((singlePageSessions / sessions30d) * 100)
    : 0;

  // ── Top pages (30d) ───────────────────────────────────────────────────────
  const pageCounts = new Map<string, number>();
  for (const e of events) {
    pageCounts.set(e.path, (pageCounts.get(e.path) ?? 0) + 1);
  }
  const topPages = [...pageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, views]) => ({ path, views }));

  // ── Daily page views (30d) ────────────────────────────────────────────────
  const dailyCounts = new Map<string, number>();
  for (const e of events) {
    const day = e.created_at.slice(0, 10); // "YYYY-MM-DD"
    dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1);
  }
  // Fill missing days with 0
  const dailyViews: { date: string; views: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyViews.push({ date: key, views: dailyCounts.get(key) ?? 0 });
  }

  // ── Utilisateurs actifs (7d) ──────────────────────────────────────────────
  const activeUserIds = [...new Set(
    events7
      .map((e) => (e as { path: string; session_id: string; created_at: string; user_id?: string | null }).user_id)
      .filter((id): id is string => !!id)
  )];

  let activeUsers: { id: string; first_name: string; last_name: string; email: string; views: number }[] = [];
  if (activeUserIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", activeUserIds);

    if (profiles) {
      // Count views per user in last 7d
      const userViews = new Map<string, number>();
      for (const e of events7) {
        const uid = (e as { user_id?: string | null }).user_id;
        if (uid) userViews.set(uid, (userViews.get(uid) ?? 0) + 1);
      }
      activeUsers = profiles.map((p) => ({
        id:         p.id,
        first_name: p.first_name,
        last_name:  p.last_name,
        email:      p.email,
        views:      userViews.get(p.id) ?? 0,
      })).sort((a, b) => b.views - a.views);
    }
  }

  return NextResponse.json({
    views7d,
    views30d,
    wau,
    mau,
    sessions7d,
    sessions30d,
    bounceRate,
    topPages,
    dailyViews,
    activeUsers,
  }, NO_CACHE);
}
