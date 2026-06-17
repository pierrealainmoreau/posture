import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { generatePlayerSecret, verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";

const FAKE_NAMES = [
  "Alice", "Benoit", "Camille", "David", "Emma",
  "Florian", "Gabrielle", "Hugo", "Isabelle", "Julien",
  "Karim", "Laura", "Mehdi", "Nina", "Oscar",
];

const FAKE_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#14b8a6",
];

const GAME_TABLES: Record<string, {
  roomTable: string;
  playerTable: string;
  extraFields?: Record<string, unknown>;
  noSecret?: boolean;
}> = {
  // Mini-jeux
  thisorthat:    { roomTable: "thisorthat_rooms",    playerTable: "thisorthat_players" },
  chaine:        { roomTable: "chaine_rooms",        playerTable: "chaine_players" },
  "code-secret": { roomTable: "code_secret_rooms",   playerTable: "code_secret_players", extraFields: { is_host: false } },
  completephrase:{ roomTable: "completephrase_rooms", playerTable: "completephrase_players" },
  undercover:    { roomTable: "undercover_rooms",    playerTable: "undercover_players" },
  humeur:        { roomTable: "humeur_rooms",        playerTable: "humeur_players" },
  tribu:         { roomTable: "tribu_rooms",         playerTable: "tribu_players" },
  draw:          { roomTable: "draw_rooms",          playerTable: "draw_players" },
  // Réunion Maker
  retrospective: { roomTable: "retro_rooms",         playerTable: "retro_players",        extraFields: { is_host: false } },
  "speed-retro": { roomTable: "speed_retro_rooms",   playerTable: "speed_retro_players",  extraFields: { is_host: false } },
  roti:          { roomTable: "roti_rooms",          playerTable: "roti_players",         extraFields: { is_host: false } },
  "kudo-cards":  { roomTable: "kudo_rooms",          playerTable: "kudo_players",         extraFields: { is_host: false } },
  abcde:         { roomTable: "abcde_rooms",         playerTable: "abcde_players",        extraFields: { is_host: false }, noSecret: true },
};

export async function POST(req: NextRequest) {
  try {
    const { game, code, playerId, playerSecret, count = 3 } = (await req.json()) as {
      game: string;
      code: string;
      playerId: string;
      playerSecret: string;
      count?: number;
    };

    if (!game || !code || !playerId) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const config = GAME_TABLES[game];
    if (!config) {
      return NextResponse.json({ error: "Jeu non supporté" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();

    if (!config.noSecret) {
      const isValid = await verifyPlayerSecret(admin, config.playerTable, playerId, playerSecret);
      if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { data: room } = await admin
      .from(config.roomTable)
      .select("id, status, host_player_id")
      .eq("code", code.toUpperCase())
      .single();

    if (!room) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });
    if (room.host_player_id !== playerId) return NextResponse.json({ error: "Réservé à l'animateur" }, { status: 403 });
    if (room.status !== "lobby") return NextResponse.json({ error: "La partie a déjà commencé" }, { status: 409 });

    const { data: existing } = await admin
      .from(config.playerTable)
      .select("pseudo")
      .eq("room_id", room.id);

    const usedNames = new Set((existing ?? []).map((p: { pseudo: string }) => p.pseudo));
    const available = FAKE_NAMES.filter((n) => !usedNames.has(n));

    const botsToAdd = Math.min(count, available.length);
    if (botsToAdd === 0) {
      return NextResponse.json({ error: "Tous les noms fictifs sont déjà utilisés" }, { status: 409 });
    }

    const bots: { id: string; pseudo: string; avatar_color: string }[] = [];
    for (let i = 0; i < botsToAdd; i++) {
      const pseudo = available[i];
      const avatar_color = FAKE_COLORS[i % FAKE_COLORS.length];
      const secretField = config.noSecret ? {} : { player_secret: generatePlayerSecret() };

      const { data: player, error } = await admin
        .from(config.playerTable)
        .insert({
          room_id: room.id,
          pseudo,
          avatar_color,
          ...secretField,
          ...(config.extraFields ?? {}),
        })
        .select("id")
        .single();

      if (!error && player) {
        bots.push({ id: (player as { id: string }).id, pseudo, avatar_color });
      }
    }

    return NextResponse.json({ ok: true, bots });
  } catch (err) {
    console.error("[POST /api/demo/add-bots]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
