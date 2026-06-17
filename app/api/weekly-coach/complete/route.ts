import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { markWeeklyCoachComplete } from "@/lib/weeklyCoach";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { action_type } = (await req.json()) as { action_type: string };
    if (!action_type) return NextResponse.json({ error: "action_type requis" }, { status: 400 });

    await markWeeklyCoachComplete(user.id, action_type);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const todayStr = new Date().toISOString().split("T")[0];
    const admin = createAdminSupabaseClient();
    await admin
      .from("daily_action_completions")
      .delete()
      .eq("user_id", user.id)
      .eq("completed_date", todayStr);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
