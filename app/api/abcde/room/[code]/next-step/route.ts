import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { nextStep } from "@/lib/abcde/types";
import type { AbcdeStatus } from "@/lib/abcde/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();
  const { playerId } = await req.json() as { playerId: string };

  const { data: room } = await admin
    .from("abcde_rooms")
    .select("id, host_player_id, status")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (room.host_player_id !== playerId) return NextResponse.json({ error: "Réservé à l'animateur" }, { status: 403 });

  const newStatus = nextStep(room.status as AbcdeStatus);
  if (!newStatus) return NextResponse.json({ error: "Dernière étape atteinte" }, { status: 400 });

  await admin
    .from("abcde_rooms")
    .update({ status: newStatus, step_started_at: new Date().toISOString() })
    .eq("id", room.id);

  return NextResponse.json({ ok: true, status: newStatus });
}
