import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const admin = createAdminSupabaseClient();

    const { data: config } = await admin
      .from("weekly_coach_configs")
      .select("need_type")
      .eq("user_id", user.id)
      .single();

    if (!config) return NextResponse.json({ configured: false });

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Dim, 1=Lun…6=Sam
    const todayStr = today.toISOString().split("T")[0];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Calcul du lundi de la semaine courante
    const monday = new Date(today);
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(today.getDate() - daysFromMonday);
    const mondayStr = monday.toISOString().split("T")[0];
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const fridayStr = friday.toISOString().split("T")[0];

    // Complétions de la semaine
    const { data: completions } = await admin
      .from("daily_action_completions")
      .select("completed_date")
      .eq("user_id", user.id)
      .gte("completed_date", mondayStr)
      .lte("completed_date", fridayStr);

    const completedDates = new Set((completions ?? []).map((c) => c.completed_date));

    // Progression semaine : jours 1 (Lun) → 5 (Ven)
    const week_progress = [1, 2, 3, 4, 5].map((day) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + (day - 1));
      return { day, completed: completedDates.has(date.toISOString().split("T")[0]) };
    });

    if (isWeekend) {
      return NextResponse.json({ configured: true, need_type: config.need_type, is_weekend: true, week_progress });
    }

    const { data: template } = await admin
      .from("daily_action_templates")
      .select("title, description, category, action_type, route")
      .eq("need_type", config.need_type)
      .eq("day_of_week", dayOfWeek)
      .single();

    return NextResponse.json({
      configured: true,
      need_type: config.need_type,
      is_weekend: false,
      template: template ?? null,
      completed: completedDates.has(todayStr),
      week_progress,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
