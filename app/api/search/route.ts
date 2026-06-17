import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, MODEL_ID } from "@/lib/anthropic";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";
import { MODULES } from "@/lib/search-modules";

const MODULES_CATALOG = MODULES.map(({ id, name, description }) => ({ id, name, description }));

const SYSTEM_PROMPT = `Tu es un assistant pour une application de management d'équipe appelée "Posture".
Tu aides les managers à trouver le bon outil parmi ceux disponibles dans l'application.

Catalogue des modules disponibles :
${JSON.stringify(MODULES_CATALOG, null, 2)}

Quand l'utilisateur décrit ce qu'il veut faire, retourne les 2 ou 3 modules les plus pertinents.
Réponds UNIQUEMENT en JSON valide, sans markdown, avec ce format exact :
{
  "suggestions": [
    { "id": "string", "reason": "string (1 phrase courte expliquant pourquoi ce module correspond)" }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("[search] auth error:", authError.message);
      return NextResponse.json({ error: "Erreur d'authentification" }, { status: 401 });
    }
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { allowed, count, limit } = await checkRateLimit(user.id, supabase);
    if (!allowed) {
      return NextResponse.json(
        { error: "Limite de requêtes atteinte", details: `Vous avez utilisé ${count}/${limit} requêtes disponibles.` },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (query.length < 3)  return NextResponse.json({ error: "Requête trop courte" }, { status: 400 });
    if (query.length > 300) return NextResponse.json({ error: "Requête trop longue" }, { status: 400 });

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: MODEL_ID,
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: query }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    let parsed: { suggestions: Array<{ id: string; reason: string }> };
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("[search] JSON parse failed, raw text:", text);
      return NextResponse.json({ error: "Réponse IA invalide" }, { status: 500 });
    }

    const enriched = (parsed.suggestions ?? [])
      .map(({ id, reason }) => {
        const mod = MODULES.find((m) => m.id === id);
        if (!mod) return null;
        return { ...mod, reason };
      })
      .filter(Boolean)
      .slice(0, 3);

    await recordUsage(user.id, "search", supabase);
    return NextResponse.json({ suggestions: enriched });
  } catch (err) {
    console.error("[search] unexpected error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
