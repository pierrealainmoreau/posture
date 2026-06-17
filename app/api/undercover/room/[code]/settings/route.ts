import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyPlayerSecret } from "@/lib/supabase/playerAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const body = (await req.json()) as { playerId: string; nbUndercovers: number; nbMrWhites: number };
  const { playerId, nbUndercovers, nbMrWhites } = body;

  const admin = createAdminSupabaseClient();
  const playerSecret = req.headers.get("X-Player-Secret");
  const isValid = await verifyPlayerSecret(admin, "undercover_players", playerId, playerSecret);
  if (!isValid) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { data: room } = await admin
    .from("undercover_rooms")
    .select("id, host_player_id, status")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (room.host_player_id !== playerId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (room.status !== "lobby") return NextResponse.json({ error: "Partie déjà démarrée" }, { status: 409 });

  const nb = nbUndercovers ?? 1;
  const nw = nbMrWhites ?? 0;

  if (nb < 1 || nb > 5) return NextResponse.json({ error: "Nombre d'Undercovers invalide (1–5)" }, { status: 400 });
  if (nw < 0 || nw > 3) return NextResponse.json({ error: "Nombre de Mr. White invalide (0–3)" }, { status: 400 });

  const { error } = await admin
    .from("undercover_rooms")
    .update({ nb_undercovers: nb, nb_mr_whites: nw })
    .eq("id", room.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
