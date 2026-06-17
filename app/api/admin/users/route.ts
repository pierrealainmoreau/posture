import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { limitForRole } from "@/lib/supabase/rateLimit";
import { dispatchNotificationTrigger } from "@/lib/notifications/dispatch";

async function getAuthedAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return null;
  return { user, supabase };
}

export async function GET() {
  const authed = await getAuthedAdmin();
  if (!authed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const admin = createAdminSupabaseClient();
  const [
    { data: profileRows, error: profilesErr },
    { data: { users: authUsers } },
  ] = await Promise.all([
    admin.from("profiles").select("id, first_name, last_name, email, role, created_at").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (profilesErr) return NextResponse.json({ error: profilesErr.message }, { status: 500 });
  if (!profileRows) return NextResponse.json({ error: "Aucune donnée" }, { status: 500 });

  const confirmedAtMap: Record<string, string | null> = {};
  for (const u of authUsers ?? []) {
    confirmedAtMap[u.id] = u.email_confirmed_at ?? null;
  }

  const { data: usageRows } = await admin.from("usage").select("user_id, tool");

  const usageMap: Record<string, Record<string, number>> = {};
  for (const row of usageRows ?? []) {
    if (!usageMap[row.user_id]) usageMap[row.user_id] = { feedback: 0, interview: 0, recruitment: 0 };
    usageMap[row.user_id][row.tool] = (usageMap[row.user_id][row.tool] ?? 0) + 1;
  }

  // ── Collaborateurs 1:1 coach ──────────────────────────────────────────────
  const { data: collabRows } = await admin
    .from("collaborators")
    .select("user_id");

  const collabMap: Record<string, number> = {};
  for (const row of collabRows ?? []) {
    collabMap[row.user_id] = (collabMap[row.user_id] ?? 0) + 1;
  }

  // ── Mini-games session counts ──────────────────────────────────────────────
  const [{ data: drawRows }, { data: tvmlRows }, { data: icebreakerRows }, { data: chaineRows }] =
    await Promise.all([
      admin.from("draw_rooms").select("creator_user_id").not("creator_user_id", "is", null),
      admin.from("tvml_rooms").select("creator_user_id"),
      admin.from("icebreaker_rooms").select("creator_user_id, game_type"),
      admin.from("chaine_rooms").select("creator_user_id"),
    ]);

  const miniMap: Record<string, { draw: number; tvml: number; anecdotes: number; icebreaker: number; chaine: number }> = {};
  const initMini = (id: string) => {
    if (!miniMap[id]) miniMap[id] = { draw: 0, tvml: 0, anecdotes: 0, icebreaker: 0, chaine: 0 };
  };
  for (const r of drawRows ?? []) {
    if (r.creator_user_id) { initMini(r.creator_user_id); miniMap[r.creator_user_id].draw++; }
  }
  for (const r of tvmlRows ?? []) {
    if (r.creator_user_id) { initMini(r.creator_user_id); miniMap[r.creator_user_id].tvml++; }
  }
  for (const r of icebreakerRows ?? []) {
    if (!r.creator_user_id) continue;
    initMini(r.creator_user_id);
    if (r.game_type === "anecdotes") {
      miniMap[r.creator_user_id].anecdotes++;
    } else {
      miniMap[r.creator_user_id].icebreaker++;
    }
  }
  for (const r of chaineRows ?? []) {
    if (r.creator_user_id) { initMini(r.creator_user_id); miniMap[r.creator_user_id].chaine++; }
  }

  // ── Sessions analytics par utilisateur ───────────────────────────────────
  const { data: sessionRows } = await admin
    .from("analytics_events")
    .select("user_id, session_id")
    .not("user_id", "is", null);

  const sessionsMap: Record<string, Set<string>> = {};
  for (const r of sessionRows ?? []) {
    if (!r.user_id) continue;
    if (!sessionsMap[r.user_id]) sessionsMap[r.user_id] = new Set();
    sessionsMap[r.user_id].add(r.session_id);
  }

  const result = profileRows.map((u) => {
    const mg = miniMap[u.id] ?? { draw: 0, tvml: 0, anecdotes: 0, icebreaker: 0, chaine: 0 };
    return {
      ...u,
      email_confirmed_at: confirmedAtMap[u.id] ?? null,
      usage_limit: limitForRole(u.role),
      usage: usageMap[u.id] ?? { feedback: 0, interview: 0, recruitment: 0 },
      totalUsage: Object.values(usageMap[u.id] ?? {}).reduce((a, b) => a + b, 0),
      collaborators: collabMap[u.id] ?? 0,
      mini_games: mg,
      totalMiniGames: mg.draw + mg.tvml + mg.anecdotes + mg.icebreaker + mg.chaine,
      sessions: sessionsMap[u.id]?.size ?? 0,
    };
  });

  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const authed = await getAuthedAdmin();
  if (!authed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await req.json();
  const { userId } = body;
  if (!userId) return NextResponse.json({ error: "userId manquant" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Confirmation manuelle de l'email
  if (body.confirm_email === true) {
    const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Mise à jour du rôle
  if ("role" in body) {
    const { role } = body;
    if (!["user", "premium", "admin"].includes(role))
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    if (userId === authed.user.id && role !== "admin")
      return NextResponse.json({ error: "Vous ne pouvez pas modifier votre propre rôle." }, { status: 400 });

    const { data: previous } = await admin.from("profiles").select("role").eq("id", userId).single();

    const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (previous?.role === "premium" && role !== "premium") {
      await dispatchNotificationTrigger("downgrade_premium", { userId });
    }

    return NextResponse.json({ ok: true });
  }

  // Mise à jour de la limite — via RPC pour contourner le cache de schéma PostgREST
  if ("usage_limit" in body) {
    const limit = Number(body.usage_limit);
    if (!Number.isInteger(limit) || limit < 0 || limit > 10000)
      return NextResponse.json({ error: "Limite invalide (0–10 000)" }, { status: 400 });
    const { error } = await admin.rpc("set_usage_limit", { p_user_id: userId, p_limit: limit });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const authed = await getAuthedAdmin();
  if (!authed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId manquant" }, { status: 400 });
  if (userId === authed.user.id) return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 });

  const admin = createAdminSupabaseClient();
  await admin.from("usage").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);

  return NextResponse.json({ ok: true });
}
