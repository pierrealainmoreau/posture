import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();
    const allowed = ["avatar_url", "linkedin_url", "coach_interest", "newsletter_opt_in"] as const;
    type AllowedKey = typeof allowed[number];

    const update: Partial<Record<AllowedKey, string | boolean | null>> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
    }

    if (!update.newsletter_opt_in && "newsletter_opt_in" in body) {
      (update as Record<string, unknown>).unsubscribed_at = new Date().toISOString();
    } else if (update.newsletter_opt_in) {
      (update as Record<string, unknown>).unsubscribed_at = null;
    }

    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("profiles").update(update).eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
