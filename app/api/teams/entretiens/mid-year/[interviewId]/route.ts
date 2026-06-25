import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { MidYearInterview, MidYearPast, MidYearPresent, MidYearFuture, MidYearStatus } from "@/lib/types";

export async function PUT(
  req: NextRequest,
  { params }: { params: { interviewId: string } },
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { interviewId } = params;

    const { data: interview } = await supabase
      .from("interviews")
      .select("id, user_id")
      .eq("id", interviewId)
      .eq("user_id", user.id)
      .single<{ id: string; user_id: string }>();

    if (!interview) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const updates = body as Partial<Pick<MidYearInterview, "past" | "present" | "future" | "status">>;

    type AllowedUpdates = {
      past?: MidYearPast;
      present?: MidYearPresent;
      future?: MidYearFuture;
      status?: MidYearStatus;
      updated_at: string;
    };

    const payload: AllowedUpdates = { updated_at: new Date().toISOString() };
    if (updates.past != null) payload.past = updates.past;
    if (updates.present != null) payload.present = updates.present;
    if (updates.future != null) payload.future = updates.future;
    if (updates.status !== undefined) payload.status = updates.status;

    const { data: updated, error } = await supabase
      .from("interviews")
      .update(payload)
      .eq("id", interviewId)
      .select("*")
      .single<MidYearInterview>();

    if (error || !updated) {
      return NextResponse.json({ error: "Erreur de mise à jour", details: error?.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
