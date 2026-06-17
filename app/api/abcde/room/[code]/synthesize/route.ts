import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getAnthropicClient, MODEL_ID } from "@/lib/anthropic";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";
import type { AbcdePosture } from "@/lib/abcde/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const POSTURE_LABELS: Record<AbcdePosture, string> = {
  inactive: "Inactive (décision différée)",
  reactive: "Réactive (action immédiate, sous contrainte d'urgence)",
  proactive: "Proactive (réflexion préalable avant mise en œuvre)",
};

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const admin = createAdminSupabaseClient();
  const code = params.code.toUpperCase();
  const { playerId } = await req.json() as { playerId: string };

  const { data: room } = await admin
    .from("abcde_rooms")
    .select("*")
    .eq("code", code)
    .single();

  if (!room) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (room.host_player_id !== playerId) return NextResponse.json({ error: "Réservé à l'animateur" }, { status: 403 });
  if (!["step_e", "synthesis"].includes(room.status)) {
    return NextResponse.json({ error: "Synthèse disponible après l'étape E" }, { status: 409 });
  }

  if (room.creator_user_id) {
    const { allowed, count, limit } = await checkRateLimit(room.creator_user_id, admin);
    if (!allowed) {
      return NextResponse.json(
        { error: "Limite de requêtes atteinte", details: `Vous avez utilisé ${count}/${limit} requêtes disponibles.` },
        { status: 429 },
      );
    }
  }

  await admin.from("abcde_rooms").update({ status: "synthesis" }).eq("id", room.id);

  const [{ data: contribs }, { data: votes }, { data: evaluations }] = await Promise.all([
    admin.from("abcde_contributions")
      .select("*, abcde_players(pseudo)")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true }),
    admin.from("abcde_votes").select("*").eq("room_id", room.id),
    admin.from("abcde_evaluations").select("rating, comment").eq("room_id", room.id),
  ]);

  const allContribs = contribs ?? [];
  const allVotes = votes ?? [];
  const allEvals = evaluations ?? [];

  const byStep = (step: string) =>
    allContribs.filter((c) => c.step === step).map((c) => {
      const pseudo = (c.abcde_players as { pseudo: string } | null)?.pseudo ?? "Anonyme";
      const cat = c.category ? ` [${c.category}]` : "";
      return `- ${pseudo}${cat}: ${c.content}`;
    }).join("\n") || "(aucune contribution)";

  const topVoted = allContribs
    .filter((c) => c.step === "b")
    .map((c) => ({
      content: c.content,
      votes: allVotes.filter((v) => v.contribution_id === c.id).reduce((s, v) => s + v.points, 0),
    }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5)
    .map((c) => `- ${c.content} (${c.votes} pts)`)
    .join("\n") || "(aucun vote)";

  const avgRating =
    allEvals.length > 0
      ? (allEvals.reduce((s, e) => s + e.rating, 0) / allEvals.length).toFixed(1)
      : "N/A";

  const evalComments = allEvals
    .filter((e) => e.comment?.trim())
    .map((e) => `- [${e.rating}/5] ${e.comment}`)
    .join("\n") || "(aucun commentaire)";

  const posture = room.decision_posture
    ? POSTURE_LABELS[room.decision_posture as AbcdePosture]
    : "Non précisée";

  const prompt = `Tu es un facilitateur expert en management. Génère une synthèse structurée et actionnable d'un atelier de prise de décision qui a suivi la méthode ABCDE.

## Données de l'atelier

**Sujet de travail :** ${room.problem_statement}

**A — Analyse de la situation :**
${byStep("a")}

**B — Brainstorming des options :**
${byStep("b")}

**Options les plus plébiscitées (vote à points) :**
${topVoted}

**D — Décision retenue :**
${room.decision_text ?? "(non renseignée)"}

**Posture choisie :**
${posture}

**E — Évaluation du processus :**
Note moyenne : ${avgRating}/5
Commentaires des participants :
${evalComments}

## Instructions

Rédige une synthèse en français, claire et professionnelle, structurée avec les sections suivantes :

1. **Contexte & Enjeu** — reformule le problème en 2-3 phrases
2. **Points clés de l'analyse** — synthèse des insights de l'étape A
3. **Idées émergentes** — les 3-5 idées les plus significatives du brainstorming
4. **Décision & Plan d'action** — la décision, sa posture, et les premières actions recommandées
5. **Leçons & Points de vigilance** — ce que l'évaluation révèle, ce à quéter lors de la mise en œuvre
6. **Score de processus** — interprétation de la note moyenne et recommandations pour améliorer les prochains ateliers

Ton : direct, managérial, constructif. Longueur : 350-500 mots.`;

  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: MODEL_ID,
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const synthesis =
      message.content[0].type === "text" ? message.content[0].text : "";

    await admin
      .from("abcde_rooms")
      .update({ synthesis, status: "finished" })
      .eq("id", room.id);

    if (room.creator_user_id) {
      await recordUsage(room.creator_user_id, "abcde", admin);
    }

    return NextResponse.json({ ok: true, synthesis });
  } catch (err) {
    await admin.from("abcde_rooms").update({ status: "step_e" }).eq("id", room.id);
    console.error("Synthesis error:", err);
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
}
