import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Pragma": "no-cache",
};

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();
  const playerId = req.nextUrl.searchParams.get("playerId") ?? "";

  const { data: room, error: roomErr } = await admin
    .from("abcde_rooms")
    .select("*")
    .eq("code", code)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404, headers: NO_CACHE });
  }

  const [{ data: players }, { data: contributions }, { data: votes }, { data: evaluations }] =
    await Promise.all([
      admin.from("abcde_players").select("*").eq("room_id", room.id).order("joined_at", { ascending: true }),
      admin.from("abcde_contributions").select("*, abcde_players(pseudo, avatar_color)").eq("room_id", room.id).order("created_at", { ascending: true }),
      admin.from("abcde_votes").select("*").eq("room_id", room.id),
      admin.from("abcde_evaluations").select("player_id, rating, comment").eq("room_id", room.id),
    ]);

  const allVotes = votes ?? [];
  const allContribs = (contributions ?? []).map((c: { id: string; player_id: string; abcde_players?: { pseudo: string; avatar_color: string } | null } & Record<string, unknown>) => {
    const { abcde_players: p, ...rest } = c;
    const total_votes = allVotes.filter((v) => v.contribution_id === c.id).reduce((s, v) => s + v.points, 0);
    const my_votes = playerId
      ? allVotes.filter((v) => v.contribution_id === c.id && v.player_id === playerId).reduce((s, v) => s + v.points, 0)
      : 0;
    return {
      ...rest,
      player_pseudo: p?.pseudo ?? null,
      player_avatar_color: p?.avatar_color ?? null,
      total_votes,
      my_votes,
    };
  });

  const evalCount = (evaluations ?? []).length;

  return NextResponse.json(
    {
      ...room,
      players: players ?? [],
      contributions: allContribs,
      votes: allVotes,
      evaluation_count: evalCount,
    },
    { headers: NO_CACHE }
  );
}
