import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyUnsubscribeSignature } from "@/lib/email";

const VALID_REASONS = ["non_sollicite", "trop_de_communications", "pas_interesse"] as const;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { u?: string; s?: string; reason?: string } | null;

  if (!body?.u || !body?.s || !verifyUnsubscribeSignature(body.u, body.s)) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 403 });
  }
  if (!body.reason || !VALID_REASONS.includes(body.reason as typeof VALID_REASONS[number])) {
    return NextResponse.json({ error: "Raison invalide" }, { status: 400 });
  }

  try {
    const admin = createAdminSupabaseClient();
    await admin.from("profiles").update({ unsubscribe_reason: body.reason }).eq("id", body.u);
  } catch { /* noop */ }

  return NextResponse.json({ ok: true });
}
