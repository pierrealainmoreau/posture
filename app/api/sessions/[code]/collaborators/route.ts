import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/sessions/[code]/collaborators?participantId=...&playerSecret=...
// Retourne la liste des collaborateurs du manager (hôte de la session)
// Authentification via playerSecret (pas de session Supabase requise côté client)
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const admin = createAdminSupabaseClient();
    const code = params.code.toUpperCase();

    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get("participantId");
    const playerSecret  = searchParams.get("playerSecret");

    if (!participantId || !playerSecret) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const isValid = await verifyPlayerSecret(admin, "session_participants", participantId, playerSecret);
    if (!isValid) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { data: participant } = await admin
      .from("session_participants")
      .select("is_host, session_id")
      .eq("id", participantId)
      .single();

    if (!participant?.is_host) {
      return NextResponse.json({ error: "Réservé à l'hôte" }, { status: 403 });
    }

    const { data: session } = await admin
      .from("sessions")
      .select("host_user_id")
      .eq("code", code)
      .single();

    if (!session?.host_user_id) {
      return NextResponse.json({ collaborators: [] });
    }

    const { data: collaborators } = await admin
      .from("collaborators")
      .select("id, first_name, last_name, role")
      .eq("user_id", session.host_user_id)
      .order("first_name", { ascending: true });

    return NextResponse.json(
      { collaborators: collaborators ?? [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[GET /api/sessions/[code]/collaborators]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
