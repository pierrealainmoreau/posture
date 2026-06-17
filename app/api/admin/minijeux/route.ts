import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

async function getAuthedAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return null;
  return user;
}

export async function GET() {
  const user = await getAuthedAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const admin = createAdminSupabaseClient();

  const [
    { data: drawRows },
    { data: tvmlRows },
    { data: icebreakerRows },
    { data: chaineRows },
  ] = await Promise.all([
    admin.from("draw_rooms").select("created_at").not("creator_user_id", "is", null),
    admin.from("tvml_rooms").select("created_at"),
    admin.from("icebreaker_rooms").select("created_at, game_type"),
    admin.from("chaine_rooms").select("created_at"),
  ]);

  // Totals per game
  const anecdoteRows = (icebreakerRows ?? []).filter(r => r.game_type === "anecdotes");
  const icebreakerOnlyRows = (icebreakerRows ?? []).filter(r => r.game_type !== "anecdotes");

  const games = [
    { key: "draw",        label: "Draw It",              rows: drawRows ?? [],          color: "orange"  },
    { key: "tvml",        label: "2 Vérités 1 Mensonge", rows: tvmlRows ?? [],          color: "purple"  },
    { key: "anecdotes",   label: "Anecdotes",            rows: anecdoteRows,            color: "emerald" },
    { key: "icebreaker",  label: "Icebreaker",           rows: icebreakerOnlyRows,      color: "blue"    },
    { key: "chaine",      label: "La Chaîne",            rows: chaineRows ?? [],        color: "rose"    },
  ];

  // Daily sessions — last 30 days, all games combined
  const now = new Date();
  const days: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days[d.toISOString().slice(0, 10)] = 0;
  }

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  for (const game of games) {
    for (const row of game.rows) {
      if (!row.created_at) continue;
      const d = new Date(row.created_at);
      if (d < thirtyDaysAgo) continue;
      const key = d.toISOString().slice(0, 10);
      if (key in days) days[key]++;
    }
  }

  const dailySessions = Object.entries(days).map(([date, count]) => ({ date, count }));

  // Per-game daily breakdown (last 30 days)
  const gamesSummary = games.map(g => ({
    key: g.key,
    label: g.label,
    color: g.color,
    total: g.rows.length,
    last7d: g.rows.filter(r => {
      if (!r.created_at) return false;
      const d = new Date(r.created_at);
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
      return d >= cutoff;
    }).length,
  }));

  return NextResponse.json({ dailySessions, games: gamesSummary });
}
