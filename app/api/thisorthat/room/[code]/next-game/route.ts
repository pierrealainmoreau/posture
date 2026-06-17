import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = {
  headers: {
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
  },
};

// GET — retourne next_game_type + next_game_code (public, léger)
export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const admin = createAdminSupabaseClient();
    const code = params.code.toUpperCase();

    const { data: room } = await admin
      .from("thisorthat_rooms")
      .select("next_game_type, next_game_code")
      .eq("code", code)
      .single();

    return NextResponse.json(
      { next_game_type: room?.next_game_type ?? null, next_game_code: room?.next_game_code ?? null },
      NO_CACHE
    );
  } catch (err) {
    console.error("[GET /api/thisorthat/room/[code]/next-game]", err);
    return NextResponse.json({ next_game_type: null, next_game_code: null }, NO_CACHE);
  }
}

// PATCH — définit le prochain jeu (creator_user_id uniquement)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const admin  = createAdminSupabaseClient();
    const supa   = createServerSupabaseClient();
    const code   = params.code.toUpperCase();

    const { data: { user } } = await supa.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { next_game_type, next_game_code } = await req.json() as {
      next_game_type: string;
      next_game_code: string;
    };

    const { data: room } = await admin
      .from("thisorthat_rooms")
      .select("id, creator_user_id")
      .eq("code", code)
      .single();

    if (!room) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });
    if (room.creator_user_id !== user.id) return NextResponse.json({ error: "Interdit" }, { status: 403 });

    await admin
      .from("thisorthat_rooms")
      .update({ next_game_type, next_game_code })
      .eq("id", room.id);

    return NextResponse.json({ ok: true }, NO_CACHE);
  } catch (err) {
    console.error("[PATCH /api/thisorthat/room/[code]/next-game]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
