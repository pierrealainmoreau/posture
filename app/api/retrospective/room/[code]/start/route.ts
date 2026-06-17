import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();
  const playerSecret = req.headers.get("X-Player-Secret") ?? "";
  const { playerId } = (await req.json()) as { playerId: string };

  const { data: room } = await admin
    .from("retro_rooms")
    .select("id, status, host_player_id")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (room.status !== "lobby") return NextResponse.json({ error: "Session déjà démarrée" }, { status: 409 });
  if (room.host_player_id !== playerId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const isValid = await verifyPlayerSecret(admin, "retro_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  await admin.from("retro_rooms").update({ status: "voting" }).eq("id", room.id);
  return NextResponse.json({ ok: true });
}
