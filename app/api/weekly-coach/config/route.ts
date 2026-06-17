import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VALID_NEED_TYPES = ["cohesion", "performance", "wellbeing", "communication", "onboarding"];

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

    return NextResponse.json({ config: config ?? null });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { need_type } = (await req.json()) as { need_type: string };
    if (!VALID_NEED_TYPES.includes(need_type)) {
      return NextResponse.json({ error: "Besoin invalide" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from("weekly_coach_configs")
      .upsert(
        { user_id: user.id, need_type, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
