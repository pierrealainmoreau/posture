import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { limitForRole } from "@/lib/supabase/rateLimit";
import { COACH_COLLAB_LIMITS } from "@/lib/types";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  const [profileRes, usageRes, collabRes, drawRes, tvmlRes, icebreakerRes, abcdeRes] = await Promise.all([
    admin.from("profiles").select("role").eq("id", user.id).single(),
    admin.from("usage").select("tool").eq("user_id", user.id),
    admin.from("collaborators").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    admin.from("draw_rooms").select("id", { count: "exact", head: true }).eq("creator_user_id", user.id),
    admin.from("tvml_rooms").select("id", { count: "exact", head: true }).eq("creator_user_id", user.id),
    admin.from("icebreaker_rooms").select("id", { count: "exact", head: true }).eq("creator_user_id", user.id),
    admin.from("abcde_rooms").select("id", { count: "exact", head: true }).eq("creator_user_id", user.id),
  ]);

  const role          = profileRes.data?.role ?? "user";
  const usageLimit    = limitForRole(role);
  const collabLimit   = role === "premium" || role === "admin" ? COACH_COLLAB_LIMITS.premium : COACH_COLLAB_LIMITS.free;

  const usageRows     = usageRes.data ?? [];
  const feedbackCount      = usageRows.filter((r) => r.tool === "feedback").length;
  const recruitmentCount   = usageRows.filter((r) => r.tool === "recruitment").length;
  const kudoCardsCount     = usageRows.filter((r) => r.tool === "kudo-cards").length;
  const iaReunionCount     = usageRows.filter((r) => r.tool === "reunion-maker" || r.tool === "prepare-reunion").length;
  const reunionMakerCount  = iaReunionCount + kudoCardsCount + (abcdeRes.count ?? 0);
  const miniGamesCount     = (drawRes.count ?? 0) + (tvmlRes.count ?? 0) + (icebreakerRes.count ?? 0);
  const collaboratorsCount = collabRes.count ?? 0;

  return NextResponse.json({
    role,
    usage_limit:          usageLimit,
    feedback_count:       feedbackCount,
    recruitment_count:    recruitmentCount,
    reunion_maker_count:  reunionMakerCount,
    collaborators_count:  collaboratorsCount,
    collaborators_limit:  collabLimit,
    mini_games_count:     miniGamesCount,
  });
}
