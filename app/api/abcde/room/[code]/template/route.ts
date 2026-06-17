import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();
  const { playerId, step, template } = await req.json() as {
    playerId: string;
    step: "a" | "b";
    template: string;
  };

  const { data: room } = await admin
    .from("abcde_rooms")
    .select("id, host_player_id")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (room.host_player_id !== playerId) return NextResponse.json({ error: "Réservé à l'animateur" }, { status: 403 });

  const field = step === "a" ? "step_a_template" : "step_b_template";

  await admin
    .from("abcde_rooms")
    .update({ [field]: template })
    .eq("id", room.id);

  return NextResponse.json({ ok: true });
}
