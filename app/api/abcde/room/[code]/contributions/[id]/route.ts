import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(
  req: NextRequest,
  { params }: { params: { code: string; id: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();
  const playerId = req.nextUrl.searchParams.get("playerId") ?? "";

  const { data: room } = await admin
    .from("abcde_rooms")
    .select("id")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  const { data: contrib } = await admin
    .from("abcde_contributions")
    .select("id, player_id")
    .eq("id", params.id)
    .eq("room_id", room.id)
    .single();

  if (!contrib) return NextResponse.json({ error: "Contribution introuvable" }, { status: 404 });

  // Only the author can delete their own contribution
  if (contrib.player_id !== playerId) {
    // Host check
    const { data: player } = await admin
      .from("abcde_players")
      .select("is_host")
      .eq("id", playerId)
      .single();
    if (!player?.is_host) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  await admin.from("abcde_contributions").delete().eq("id", params.id);

  return NextResponse.json({ ok: true });
}
