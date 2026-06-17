import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

async function getAuthedAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return null;
  return { user, supabase };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const authed = await getAuthedAdmin();
  if (!authed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { userId } = params;
  if (!userId) return NextResponse.json({ error: "userId manquant" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  const [
    { data: usageRows },
    { data: pageRows },
    { data: drawRows },
    { data: tvmlRows },
    { data: icebreakerRows },
    { data: chaineRows },
  ] = await Promise.all([
    admin
      .from("usage")
      .select("tool, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("analytics_events")
      .select("path, created_at, session_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("draw_rooms")
      .select("created_at")
      .eq("creator_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("tvml_rooms")
      .select("created_at")
      .eq("creator_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("icebreaker_rooms")
      .select("created_at, game_type")
      .eq("creator_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("chaine_rooms")
      .select("created_at")
      .eq("creator_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  // Build unified timeline events
  type Event = { type: string; label: string; created_at: string; meta?: string };
  const events: Event[] = [];

  const TOOL_LABELS: Record<string, string> = {
    feedback:          "Feedback salarié",
    interview:         "Préparation entretien",
    recruitment:       "Offre de recrutement",
    "reunion-maker":   "Compte-rendu réunion",
    "prepare-reunion": "Compte-rendu réunion",
    "kudo-cards":      "Kudo Cards",
    retrospective:     "Rétrospective",
    chaine:            "La Chaîne (IA)",
    humeur:            "Humeur de l'équipe",
    boussole:          "Boussole",
    tribu:             "Tribu",
    undercover:        "Undercover",
    draw:              "Draw My LVCA",
    tvml:              "TVML",
    icebreaker:        "Icebreaker",
    anecdotes:         "Anecdotes",
    abcde:             "ABCDE",
    roti:              "ROTI",
    "speed-retro":     "Speed Retro",
  };

  for (const r of usageRows ?? []) {
    events.push({
      type: "tool",
      label: TOOL_LABELS[r.tool] ?? r.tool,
      created_at: r.created_at,
      meta: r.tool,
    });
  }

  for (const r of drawRows ?? []) {
    events.push({ type: "minijeu", label: "Session Draw My LVCA", created_at: r.created_at, meta: "draw" });
  }
  for (const r of tvmlRows ?? []) {
    events.push({ type: "minijeu", label: "Session TVML", created_at: r.created_at, meta: "tvml" });
  }
  for (const r of icebreakerRows ?? []) {
    const isAnec = r.game_type === "anecdotes";
    events.push({ type: "minijeu", label: isAnec ? "Session Anecdotes" : "Session Icebreaker", created_at: r.created_at, meta: isAnec ? "anecdotes" : "icebreaker" });
  }
  for (const r of chaineRows ?? []) {
    events.push({ type: "minijeu", label: "Session La Chaîne", created_at: r.created_at, meta: "chaine" });
  }

  // Page events — deduplicate by path+minute to reduce noise
  const pageEventsSeen = new Set<string>();
  for (const r of pageRows ?? []) {
    const minuteKey = `${r.path}|${r.created_at.slice(0, 16)}`;
    if (!pageEventsSeen.has(minuteKey)) {
      pageEventsSeen.add(minuteKey);
      events.push({ type: "page", label: r.path, created_at: r.created_at, meta: r.session_id });
    }
  }

  // Sort by most recent
  events.sort((a, b) => b.created_at.localeCompare(a.created_at));

  return NextResponse.json({ events: events.slice(0, 300) });
}
