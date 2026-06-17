import { createAdminSupabaseClient } from "@/lib/supabase/server";

export async function markWeeklyCoachComplete(
  userId: string,
  actionType: string
): Promise<void> {
  try {
    const admin = createAdminSupabaseClient();

    const { data: config } = await admin
      .from("weekly_coach_configs")
      .select("need_type")
      .eq("user_id", userId)
      .single();

    if (!config) return;

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Dim, 1=Lun…5=Ven, 6=Sam
    if (dayOfWeek === 0 || dayOfWeek === 6) return;

    const { data: template } = await admin
      .from("daily_action_templates")
      .select("action_type")
      .eq("need_type", config.need_type)
      .eq("day_of_week", dayOfWeek)
      .single();

    if (!template || template.action_type !== actionType) return;

    const todayStr = today.toISOString().split("T")[0];
    await admin
      .from("daily_action_completions")
      .upsert(
        { user_id: userId, completed_date: todayStr, action_type: actionType },
        { onConflict: "user_id,completed_date" }
      );
  } catch {
    // Ne pas bloquer le flux principal si le tracking échoue
  }
}
