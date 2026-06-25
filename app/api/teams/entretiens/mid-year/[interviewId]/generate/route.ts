import { NextRequest, NextResponse } from "next/server";
import { MODEL_ID, MAX_TOKENS_COACH, getAnthropicClient } from "@/lib/anthropic";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildMidYearPrompt } from "@/lib/prompts/mid-year";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";
import type { Collaborator } from "@/lib/types";

function extractJson(raw: string): string {
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { interviewId: string } },
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { allowed } = await checkRateLimit(user.id, supabase);
    if (!allowed) return NextResponse.json({ error: "Limite atteinte" }, { status: 429 });

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const { section } = body as { section: "past" | "present" | "future" };
    if (!["past", "present", "future"].includes(section)) {
      return NextResponse.json({ error: "Section invalide" }, { status: 400 });
    }

    type InterviewWithCollab = {
      id: string;
      user_id: string;
      collaborator: Collaborator;
    };

    const { data: interview } = await supabase
      .from("interviews")
      .select("id, user_id, collaborator:collaborators(*)")
      .eq("id", params.interviewId)
      .single<InterviewWithCollab>();

    if (!interview || interview.user_id !== user.id) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }

    const { collaborator } = interview;
    const systemPrompt = buildMidYearPrompt({
      section,
      role: collaborator.role,
      seniority: collaborator.seniority,
    });

    let questions: string[];
    try {
      const message = await getAnthropicClient().messages.create({
        model: MODEL_ID,
        max_tokens: MAX_TOKENS_COACH,
        system: systemPrompt,
        messages: [{ role: "user", content: `Génère les questions pour la séquence "${section}".` }],
      });

      if (message.stop_reason === "max_tokens") {
        return NextResponse.json({ error: "Réponse tronquée" }, { status: 502 });
      }

      const textBlock = message.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        return NextResponse.json({ error: "Réponse vide" }, { status: 502 });
      }

      const parsed = JSON.parse(extractJson(textBlock.text)) as { questions: string[] };
      questions = parsed.questions;
    } catch (e) {
      return NextResponse.json(
        { error: "Échec IA", details: e instanceof Error ? e.message : "Erreur" },
        { status: 502 },
      );
    }

    await recordUsage(user.id, "teams", supabase);
    return NextResponse.json({ questions });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
