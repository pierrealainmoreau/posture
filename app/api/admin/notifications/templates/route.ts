import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return user;
}

export async function GET() {
  try {
    const admin = await assertAdmin();
    if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const sb = createAdminSupabaseClient();
    const { data, error } = await sb
      .from("notification_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ templates: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await assertAdmin();
    if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { title, body, type = "info", href, trigger_event } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

    const sb = createAdminSupabaseClient();
    const { data, error } = await sb
      .from("notification_templates")
      .insert({ title, body: body ?? null, type, href: href ?? null, trigger_event: trigger_event ?? null })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ template: data });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
