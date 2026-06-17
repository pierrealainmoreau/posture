import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, MODEL_ID } from "@/lib/anthropic";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";

const MAX_TOKENS = 1500;

const SYSTEM_PROMPT =
  "Tu es un expert en facilitation et en management. Tu aides les managers à structurer leurs réunions d'équipe de façon efficace et adaptée à leur contexte. Réponds uniquement en JSON valide, sans balises Markdown, sans commentaires.";

function formatDuree(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

function buildUserPrompt(type: string, contexte: string, participants: string, stakeholders: string, duree: number): string {
  return `Génère le meilleur découpage possible pour une réunion avec le contexte suivant :
- Type de réunion : ${type}${contexte ? `\n- Contexte : ${contexte}` : ""}
- Durée totale : ${formatDuree(duree)}
- Nombre de participants : ${participants}
- Niveau des stakeholders : ${stakeholders}

Réponds avec un objet JSON structuré exactement comme ceci :
{
  "conseil_general": "Une phrase de conseil adapté au contexte (ex: avec des N+1, soigne l'intro)",
  "ordre_du_jour": [
    {
      "sujet": "Sujet formulé comme une question ou une action concrète (ex: Valider le budget Q3, Comment améliorer notre process de déploiement ?)",
      "objectif": "décision | information | discussion",
      "raison_presence": "En une phrase : pourquoi les participants sont concernés par ce point"
    }
  ],
  "etapes": [
    {
      "titre": "Titre court de l'étape",
      "duree_suggeree": "ex: 5 min",
      "description": "Une phrase expliquant le rôle de cette étape",
      "tips": ["tip 1", "tip 2", "tip 3"]
    }
  ]
}

Pour l'ordre du jour : génère 2 à 5 points selon le type de réunion. Chaque sujet doit être formulé comme une question ou une action (jamais un mot vague comme "Budget" → préférer "Valider le budget Q3"). L'objectif doit être exactement l'une de ces trois valeurs : "décision", "information", "discussion".
Pour les étapes : génère entre 3 et 5 étapes. La somme des durées suggérées doit correspondre à la durée totale de ${formatDuree(duree)}. Les tips doivent être courts, actionnables, rédigés en tutoiement.`;
}

function extractJson(raw: string): string {
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed, count, limit } = await checkRateLimit(user.id, supabase);
  if (!allowed) {
    return NextResponse.json(
      {
        error: "Limite de requêtes atteinte",
        details: `Vous avez utilisé ${count}/${limit} requêtes disponibles.`,
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  if (typeof b.type !== "string" || !b.type.trim()) {
    return NextResponse.json({ error: "Champ 'type' manquant" }, { status: 400 });
  }
  const contexte = typeof b.contexte === "string" ? b.contexte.trim().slice(0, 500) : "";
  if (typeof b.participants !== "string" || !["< 5", "5–10", "10+"].includes(b.participants)) {
    return NextResponse.json({ error: "Nombre de participants invalide" }, { status: 400 });
  }
  if (typeof b.stakeholders !== "string" || !b.stakeholders.trim()) {
    return NextResponse.json({ error: "Champ 'stakeholders' manquant" }, { status: 400 });
  }
  const duree = typeof b.duree === "number" && b.duree >= 15 && b.duree <= 120 ? b.duree : 45;

  try {
    const message = await getAnthropicClient().messages.create({
      model: MODEL_ID,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserPrompt(b.type, contexte, b.participants, b.stakeholders, duree),
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Réponse vide de l'IA" }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(textBlock.text));
    } catch (e) {
      return NextResponse.json(
        {
          error: "Réponse mal formatée",
          details: e instanceof Error ? e.message : String(e),
        },
        { status: 502 },
      );
    }

    await recordUsage(user.id, "reunion-maker", supabase);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json(
      {
        error: "Échec de l'appel à l'IA",
        details: e instanceof Error ? e.message : "Erreur inconnue",
      },
      { status: 502 },
    );
  }
}
