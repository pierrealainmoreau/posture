import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";
import { dispatchNotificationTrigger } from "@/lib/notifications/dispatch";

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
    .select("id, status, host_player_id, creator_user_id")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (room.status !== "voting") return NextResponse.json({ error: "Vote non en cours" }, { status: 409 });
  if (room.host_player_id !== playerId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const isValid = await verifyPlayerSecret(admin, "retro_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  await admin.from("retro_rooms").update({ status: "finished" }).eq("id", room.id);

  if (room.creator_user_id) {
    await dispatchNotificationTrigger("retro_completed", { userId: room.creator_user_id });
  }

  return NextResponse.json({ ok: true });
}
