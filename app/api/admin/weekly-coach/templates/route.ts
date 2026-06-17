import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return null;
  return admin;
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { data: templates } = await admin
      .from("daily_action_templates")
      .select("*")
      .order("need_type")
      .order("day_of_week");

    return NextResponse.json(templates ?? []);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const body = (await req.json()) as {
      id: string;
      title: string;
      description?: string;
      category: string;
      action_type: string;
      route: string;
    };

    if (!body.id || !body.title || !body.category || !body.action_type || !body.route) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const { error } = await admin
      .from("daily_action_templates")
      .update({
        title: body.title,
        description: body.description ?? null,
        category: body.category,
        action_type: body.action_type,
        route: body.route,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
