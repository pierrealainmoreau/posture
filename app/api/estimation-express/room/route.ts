import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { generatePlayerSecret } from "@/lib/supabase/playerAuth";
import { markWeeklyCoachComplete } from "@/lib/weeklyCoach";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const { data: rooms } = await admin
      .from("estimation_express_rooms")
      .select("id, code, status, total_questions, created_at")
      .eq("creator_user_id", user.id)
      .order("created_at", { ascending: false });

    if (!rooms) return NextResponse.json([]);

    const roomIds = rooms.map((r) => r.id);
    const { data: players } = await admin
      .from("estimation_express_players")
      .select("room_id")
      .in("room_id", roomIds);

    const result = rooms.map((r) => ({
      ...r,
      player_count: (players ?? []).filter((p) => p.room_id === r.id).length,
    }));

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", "Pragma": "no-cache" },
    });
  } catch (err) {
    console.error("[GET /api/estimation-express/room]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      pseudo: string;
      avatarColor: string;
      questions: Array<{ text: string; answer: number; min: number; max: number; unit: string; step: number; funfact?: string }>;
    };

    const { pseudo, avatarColor, questions } = body;

    if (!pseudo?.trim() || !questions?.length) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }
    if (questions.length < 3 || questions.length > 10) {
      return NextResponse.json({ error: "Entre 3 et 10 questions requises" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

    const admin = createAdminSupabaseClient();

    for (let i = 0; i < 5; i++) {
      const code = generateCode();

      const { data: room, error: roomErr } = await admin
        .from("estimation_express_rooms")
        .insert({ code, creator_user_id: user.id, questions, total_questions: questions.length })
        .select("id, code")
        .single();

      if (roomErr) {
        if (roomErr.message.includes("unique")) continue;
        return NextResponse.json({ error: roomErr.message }, { status: 500 });
      }

      const playerSecret = generatePlayerSecret();
      const { data: player, error: playerErr } = await admin
        .from("estimation_express_players")
        .insert({ room_id: room.id, pseudo: pseudo.trim(), avatar_color: avatarColor ?? "#3b82f6", is_host: true, player_secret: playerSecret, score: 0 })
        .select("id")
        .single();

      if (playerErr || !player) {
        await admin.from("estimation_express_rooms").delete().eq("id", room.id);
        return NextResponse.json({ error: playerErr?.message ?? "Erreur joueur" }, { status: 500 });
      }

      await admin.from("estimation_express_rooms").update({ host_player_id: player.id }).eq("id", room.id);
      await admin.from("usage").insert({ user_id: user.id, tool: "estimationexpress" });
      await markWeeklyCoachComplete(user.id, "estimationexpress");

      return NextResponse.json({ code: room.code, playerId: player.id, playerSecret });
    }

    return NextResponse.json({ error: "Impossible de créer la session" }, { status: 500 });
  } catch (err) {
    console.error("[POST /api/estimation-express/room]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
