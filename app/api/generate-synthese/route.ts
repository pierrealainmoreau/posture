import { NextRequest, NextResponse } from "next/server";
import { MAX_TOKENS_SYNTHESE, MODEL_ID, getAnthropicClient } from "@/lib/anthropic";
import {
  buildSyntheseSystemPrompt,
  type CollabSnapshot,
  type SyntheseDestinataire,
  type SyntheseType,
} from "@/lib/prompts/synthese-system";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";
import type { Collaborator, CollaboratorOkr, WeeklySession } from "@/lib/types";

const VALID_TYPES: SyntheseType[] = ["resultats", "ressources", "blocage", "rh", "general"];
const VALID_DESTINATAIRES: SyntheseDestinataire[] = ["n1", "drh", "codir"];

interface SyntheseRequest {
  collaborator_ids: string[];
  type: SyntheseType;
  destinataire: SyntheseDestinataire;
  context: string;
}

interface SyntheseResponse {
  note: string;
  warnings: string[];
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed, count, limit } = await checkRateLimit(user.id, supabase);
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite de requêtes atteinte", details: `${count}/${limit} requêtes utilisées.` },
      { status: 429 },
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const collaboratorIds = b.collaborator_ids;
  const type = b.type as SyntheseType;
  const destinataire = b.destinataire as SyntheseDestinataire;
  const context = typeof b.context === "string" ? b.context.slice(0, 1000) : "";

  if (!Array.isArray(collaboratorIds) || collaboratorIds.length === 0) {
    return NextResponse.json({ error: "Au moins un collaborateur est requis" }, { status: 400 });
  }
  if (collaboratorIds.length > 10) {
    return NextResponse.json({ error: "Maximum 10 collaborateurs par synthèse" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Type de synthèse invalide" }, { status: 400 });
  }
  if (!VALID_DESTINATAIRES.includes(destinataire)) {
    return NextResponse.json({ error: "Destinataire invalide" }, { status: 400 });
  }

  try {
    // Fetch collaborators (filtered by user_id via RLS)
    const { data: collabs, error: collabsError } = await supabase
      .from("collaborators")
      .select("id, first_name, last_name, role, seniority, period, current_ops_topics")
      .eq("user_id", user.id)
      .in("id", collaboratorIds);

    if (collabsError) return NextResponse.json({ error: collabsError.message }, { status: 500 });
    if (!collabs || collabs.length === 0) {
      return NextResponse.json({ error: "Aucun collaborateur trouvé" }, { status: 404 });
    }

    // Fetch most recent company OKR to resolve collaborator OKRs
    const { data: companyOkr } = await supabase
      .from("company_okrs")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();

    // For each collaborator, fetch OKR + last 2 sessions in parallel
    const snapshots: CollabSnapshot[] = await Promise.all(
      (collabs as Pick<Collaborator, "id" | "first_name" | "last_name" | "role" | "seniority" | "period" | "current_ops_topics">[]).map(async (c) => {
        const [okrResult, sessionsResult] = await Promise.all([
          companyOkr
            ? supabase
                .from("collaborator_okrs")
                .select("objective, key_results")
                .eq("collaborator_id", c.id)
                .eq("company_okr_id", companyOkr.id)
                .maybeSingle<Pick<CollaboratorOkr, "objective" | "key_results">>()
            : Promise.resolve({ data: null }),
          supabase
            .from("weekly_sessions")
            .select("week_number, priority_topic_1, priority_topic_2, manager_notes, is_completed")
            .eq("collaborator_id", c.id)
            .order("week_number", { ascending: false })
            .limit(2),
        ]);

        return {
          first_name: c.first_name,
          last_name: c.last_name,
          role: c.role,
          seniority: c.seniority,
          period: c.period,
          current_ops_topics: c.current_ops_topics,
          okr: okrResult.data ?? null,
          recent_sessions: (sessionsResult.data ?? []) as Pick<
            WeeklySession,
            "week_number" | "priority_topic_1" | "priority_topic_2" | "manager_notes" | "is_completed"
          >[],
        };
      })
    );

    const systemPrompt = buildSyntheseSystemPrompt({ collaborators: snapshots, type, destinataire, context });

    const message = await getAnthropicClient().messages.create({
      model: MODEL_ID,
      max_tokens: MAX_TOKENS_SYNTHESE,
      system: systemPrompt,
      messages: [{ role: "user", content: "Génère la note de synthèse managériale." }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Réponse vide de l'IA" }, { status: 502 });
    }

    let parsed: SyntheseResponse;
    try {
      parsed = JSON.parse(extractJson(textBlock.text)) as SyntheseResponse;
    } catch (e) {
      return NextResponse.json(
        { error: "Réponse mal formatée", details: e instanceof Error ? e.message : String(e) },
        { status: 502 },
      );
    }

    await recordUsage(user.id, "synthese", supabase);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json(
      { error: "Échec de l'appel à l'IA", details: e instanceof Error ? e.message : "Erreur inconnue" },
      { status: 502 },
    );
  }
}
