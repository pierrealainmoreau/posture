import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

// POST — save PMF answer (authenticated user)
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { answer } = await req.json();
  const valid = ["very_disappointed", "somewhat_disappointed", "not_disappointed"];
  if (!valid.includes(answer)) {
    return NextResponse.json({ error: "Réponse invalide" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  // Upsert — one answer per user, overwriteable
  const { error } = await admin
    .from("pmf_answers")
    .upsert({ user_id: user.id, answer }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// GET — all answers with profile info (admin only)
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("pmf_answers")
    .select("id, answer, created_at, profiles(first_name, last_name, email)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
