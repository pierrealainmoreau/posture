import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";
import { KUDO_CATEGORIES } from "@/lib/kudo-cards/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_CATEGORY_IDS = new Set(KUDO_CATEGORIES.map((c) => c.id));

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();
  const playerSecret = req.headers.get("X-Player-Secret") ?? "";

  const { authorId, recipientId, category, message } = (await req.json()) as {
    authorId: string;
    recipientId: string;
    category: string;
    message: string;
  };

  if (!authorId || !recipientId || !category || !message?.trim()) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  if (!VALID_CATEGORY_IDS.has(category)) {
    return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
  }

  if (authorId === recipientId) {
    return NextResponse.json({ error: "Impossible de s'envoyer une carte à soi-même" }, { status: 400 });
  }

  const { data: room } = await admin
    .from("kudo_rooms")
    .select("id, status")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (room.status !== "writing") {
    return NextResponse.json({ error: "La phase d'écriture n'est pas active" }, { status: 409 });
  }

  const isValid = await verifyPlayerSecret(admin, "kudo_players", authorId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { data: card, error: cardErr } = await admin
    .from("kudo_cards")
    .insert({
      room_id: room.id,
      author_id: authorId,
      recipient_id: recipientId,
      category,
      message: message.trim(),
    })
    .select("id")
    .single();

  if (cardErr) {
    if (cardErr.message.includes("unique")) {
      return NextResponse.json({ error: "Vous avez déjà envoyé une carte à cette personne" }, { status: 409 });
    }
    return NextResponse.json({ error: cardErr.message }, { status: 500 });
  }

  return NextResponse.json({ cardId: card.id }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    },
  });
}
