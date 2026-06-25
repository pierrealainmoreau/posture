import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { MidYearPast, MidYearPresent, MidYearFuture } from "@/lib/types";

interface MidYearPublicContext {
  id: string;
  year: number;
  collaborator_submitted_at: string | null;
  collaborator_first_name: string;
  collaborator_last_name: string;
  collaborator_role: string;
  past: MidYearPast | null;
  present: MidYearPresent | null;
  future: MidYearFuture | null;
  collab_past: Partial<MidYearPast> | null;
  collab_present: Partial<MidYearPresent> | null;
  collab_future: Partial<MidYearFuture> | null;
}

// GET — vue publique via token (service role)
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: interview } = await supabase
      .from("interviews")
      .select("id, year, collaborator_submitted_at, collaborator_id, past, present, future, collab_past, collab_present, collab_future")
      .eq("share_token", params.token)
      .eq("type", "mid_year")
      .maybeSingle();

    if (!interview) return NextResponse.json({ error: "Lien introuvable ou expiré" }, { status: 404 });

    const { data: collab } = await supabase
      .from("collaborators")
      .select("first_name, last_name, role")
      .eq("id", interview.collaborator_id)
      .single<{ first_name: string; last_name: string; role: string }>();

    const result: MidYearPublicContext = {
      id: interview.id,
      year: interview.year,
      collaborator_submitted_at: interview.collaborator_submitted_at,
      collaborator_first_name: collab?.first_name ?? "",
      collaborator_last_name: collab?.last_name ?? "",
      collaborator_role: collab?.role ?? "",
      past: interview.past as MidYearPast | null,
      present: interview.present as MidYearPresent | null,
      future: interview.future as MidYearFuture | null,
      collab_past: interview.collab_past as Partial<MidYearPast> | null,
      collab_present: interview.collab_present as Partial<MidYearPresent> | null,
      collab_future: interview.collab_future as Partial<MidYearFuture> | null,
    };

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// PUT — le collaborateur soumet son auto-évaluation (service role)
export async function PUT(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const supabase = createAdminSupabaseClient();

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const { collab_past, collab_present, collab_future } = body as {
      collab_past?: Partial<MidYearPast>;
      collab_present?: Partial<MidYearPresent>;
      collab_future?: Partial<MidYearFuture>;
    };

    const { data: interview } = await supabase
      .from("interviews")
      .select("id, collaborator_submitted_at")
      .eq("share_token", params.token)
      .eq("type", "mid_year")
      .maybeSingle<{ id: string; collaborator_submitted_at: string | null }>();

    if (!interview) return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("interviews")
      .update({
        collab_past: collab_past ?? undefined,
        collab_present: collab_present ?? undefined,
        collab_future: collab_future ?? undefined,
        collaborator_submitted_at: interview.collaborator_submitted_at ?? now,
        updated_at: now,
      })
      .eq("id", interview.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
