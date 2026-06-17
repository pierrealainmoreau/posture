import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const admin = createAdminSupabaseClient();

    const [profileRes, invitedRes] = await Promise.all([
      admin
        .from("profiles")
        .select("referral_code, referral_count")
        .eq("id", user.id)
        .single(),
      admin
        .from("profiles")
        .select("first_name, created_at")
        .eq("referred_by", user.id)
        .order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      referral_code:  profileRes.data?.referral_code  ?? null,
      referral_count: profileRes.data?.referral_count ?? 0,
      invited:        invitedRes.data ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
