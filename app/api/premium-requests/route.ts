import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { dispatchNotificationTrigger } from "@/lib/notifications/dispatch";

// POST — utilisateur authentifié soumet une demande premium
export async function POST() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Vérifier si déjà premium
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();

  if (profile?.is_premium) {
    return NextResponse.json({ error: "Vous êtes déjà membre Premium." }, { status: 409 });
  }

  const admin = createAdminSupabaseClient();

  // Vérifier si une demande pending existe déjà
  const { data: existing } = await admin
    .from("premium_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Une demande est déjà en cours." }, { status: 409 });
  }

  const { error } = await admin
    .from("premium_requests")
    .insert({ user_id: user.id, status: "pending" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// GET — statut de la demande de l'utilisateur courant (ou liste admin)
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Admin → retourne toutes les demandes
  if (profile?.role === "admin") {
    const admin = createAdminSupabaseClient();

    // Fetch requests
    const { data: requests, error } = await admin
      .from("premium_requests")
      .select("id, status, created_at, updated_at, user_id")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!requests || requests.length === 0) return NextResponse.json([]);

    // Fetch profiles separately (jointure manuelle — plus fiable que PostgREST via auth.users)
    const userIds = requests.map((r) => r.user_id);
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", userIds);

    const profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, { first_name: p.first_name, last_name: p.last_name, email: p.email }])
    );

    const result = requests.map((r) => ({
      ...r,
      profiles: profileMap[r.user_id] ?? null,
    }));

    return NextResponse.json(result);
  }

  // Utilisateur → retourne sa propre demande la plus récente
  const { data } = await supabase
    .from("premium_requests")
    .select("id, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json(data ?? null);
}

// PATCH — admin approuve ou rejette une demande
export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id, action } = await req.json() as { id: string; action: "approve" | "reject" };

  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // Récupérer la demande pour obtenir le user_id
  const { data: request } = await admin
    .from("premium_requests")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!request) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });

  const newStatus = action === "approve" ? "approved" : "rejected";

  // Mettre à jour le statut de la demande
  const { error: reqErr } = await admin
    .from("premium_requests")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });

  // Si approbation → activer is_premium et passer le rôle à "premium"
  if (action === "approve") {
    const { error: profileErr } = await admin
      .from("profiles")
      .update({ is_premium: true, role: "premium" })
      .eq("id", request.user_id);

    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

    await dispatchNotificationTrigger("upgrade_premium", { userId: request.user_id });
  }

  return NextResponse.json({ ok: true });
}
