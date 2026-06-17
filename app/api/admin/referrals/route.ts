import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const admin = createAdminSupabaseClient();

    const { data: referrers } = await admin
      .from("profiles")
      .select("id, first_name, last_name, email, referral_code, referral_count")
      .gt("referral_count", 0)
      .order("referral_count", { ascending: false });

    if (!referrers || referrers.length === 0) return NextResponse.json([]);

    const { data: invited } = await admin
      .from("profiles")
      .select("first_name, created_at, referred_by")
      .in("referred_by", referrers.map((r) => r.id))
      .order("created_at", { ascending: false });

    const byReferrer = (invited ?? []).reduce<
      Record<string, { first_name: string; created_at: string }[]>
    >((acc, inv) => {
      if (!inv.referred_by) return acc;
      (acc[inv.referred_by] ??= []).push({
        first_name: inv.first_name,
        created_at: inv.created_at,
      });
      return acc;
    }, {});

    return NextResponse.json(
      referrers.map((r) => ({ ...r, invited: byReferrer[r.id] ?? [] }))
    );
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
