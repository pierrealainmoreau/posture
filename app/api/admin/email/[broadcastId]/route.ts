import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

async function getAuthedAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return null;
  return { user };
}

export async function GET(
  _req: Request,
  { params }: { params: { broadcastId: string } },
) {
  try {
    const authed = await getAuthedAdmin();
    if (!authed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const admin = createAdminSupabaseClient();

    const { data: broadcast, error: broadcastErr } = await admin
      .from("email_broadcasts")
      .select("id, created_at, subject, blocks, target, target_label, sent_count, opens, clicks")
      .eq("id", params.broadcastId)
      .single();

    if (broadcastErr) return NextResponse.json({ error: broadcastErr.message }, { status: 404 });

    const { data: recipients, error: recipientsErr } = await admin
      .from("email_broadcast_recipients")
      .select("id, user_id, email, first_name, sent_at, opened_at, open_count, clicked_at, click_count")
      .eq("broadcast_id", params.broadcastId)
      .order("opened_at", { ascending: false, nullsFirst: false });

    return NextResponse.json({
      broadcast,
      recipients: recipientsErr ? [] : (recipients ?? []),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur serveur" }, { status: 500 });
  }
}
