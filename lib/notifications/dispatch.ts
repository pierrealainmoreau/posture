import { createAdminSupabaseClient } from "@/lib/supabase/server";

export type TriggerEvent =
  | "upgrade_premium"
  | "downgrade_premium"
  | "suggestion_answered"
  | "minigame_completed"
  | "retro_completed"
  | "roadmap_item_shipped"
  | "user_signup"
  | "first_login"
  | "user_inactive_7d"
  | "user_inactive_30d"
  | "trial_ending"
  | "kudo_received"
  | "new_feature_release"
  | "signup_anniversary";

type DispatchTarget = { userId: string } | { userIds: string[] } | { broadcast: true };

/**
 * Envoie une notification à partir des templates actifs liés à `event`.
 * Ne lève jamais : un souci de notification ne doit jamais faire échouer l'action métier qui l'a déclenché.
 */
export async function dispatchNotificationTrigger(event: TriggerEvent, target: DispatchTarget) {
  try {
    const admin = createAdminSupabaseClient();
    const { data: templates } = await admin
      .from("notification_templates")
      .select("title, body, type, href")
      .eq("trigger_event", event)
      .eq("is_active", true);

    if (!templates || templates.length === 0) return;

    let userIds: string[];
    if ("userId" in target) {
      userIds = [target.userId];
    } else if ("userIds" in target) {
      userIds = target.userIds;
    } else {
      const { data: profiles } = await admin.from("profiles").select("id");
      userIds = (profiles ?? []).map((p: { id: string }) => p.id);
    }
    if (userIds.length === 0) return;

    const rows = templates.flatMap((tpl) =>
      userIds.map((uid) => ({
        user_id: uid,
        title: tpl.title,
        body: tpl.body,
        type: tpl.type,
        href: tpl.href,
      }))
    );

    await admin.from("notifications").insert(rows);
  } catch {
    // best-effort — ne jamais bloquer l'appelant
  }
}
