import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("suggestions")
    .select("id, category, message, created_at, status, rejection_reason")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// PATCH — l'utilisateur modifie sa propre suggestion si elle est encore "pending"
export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id, category, message } = await req.json() as {
    id: string;
    category: string;
    message: string;
  };

  if (!id || !message?.trim()) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }
  if (message.trim().length < 10) {
    return NextResponse.json({ error: "Message trop court (10 caractères min.)" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // Vérifie que la suggestion appartient bien à l'utilisateur et est encore "pending"
  const { data: existing } = await admin
    .from("suggestions")
    .select("status, user_id")
    .eq("id", id)
    .single();

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "Suggestion introuvable" }, { status: 404 });
  }
  if (existing.status !== "pending") {
    return NextResponse.json({ error: "Cette suggestion ne peut plus être modifiée." }, { status: 403 });
  }

  const { error } = await admin
    .from("suggestions")
    .update({ category, message: message.trim() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
