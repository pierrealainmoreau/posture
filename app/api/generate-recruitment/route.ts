import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, MODEL_ID } from "@/lib/anthropic";
import { buildRecruiterSystemPrompt, buildCandidateSystemPrompt } from "@/lib/prompts/recruitment-system";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, recordUsage } from "@/lib/supabase/rateLimit";
import type { RecruitmentRequest, SeniorityLevel, PostType, CandidatePriority } from "@/lib/types";

const MAX_TOKENS = 1500;
const VALID_SENIORITY: SeniorityLevel[] = ["1-3", "4-5", "6-8", "8-10", "10+"];
const VALID_POST_TYPE: PostType[] = ["execution", "strategie", "mixte"];
const VALID_PRIORITY: CandidatePriority[] = ["career", "balance", "benefits"];

function extractJson(raw: string): string {
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

function isSafeUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return false;
  const h = parsed.hostname.toLowerCase();
  if (
    h === "localhost" ||
    h.endsWith(".local") ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^169\.254\./.test(h) ||
    /^::1$/.test(h) ||
    /^fc00:/i.test(h)
  ) return false;
  return true;
}

async function fetchJobListing(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1500);
  } catch {
    return "";
  }
}

function validate(body: unknown): RecruitmentRequest | { error: string } {
  if (!body || typeof body !== "object") return { error: "Corps de requête invalide" };
  const b = body as Record<string, unknown>;

  if (b.mode === "recruiter") {
    if (typeof b.jobTitle !== "string" || b.jobTitle.trim().length < 3)
      return { error: "Intitulé du poste trop court" };
    if (!VALID_SENIORITY.includes(b.seniority as SeniorityLevel))
      return { error: "Niveau de séniorité invalide" };
    if (!VALID_POST_TYPE.includes(b.postType as PostType))
      return { error: "Type de poste invalide" };
    if (typeof b.keySkills !== "string" || b.keySkills.trim().length < 3)
      return { error: "Compétence attendue trop courte" };
    return {
      mode: "recruiter",
      jobTitle: (b.jobTitle as string).trim(),
      seniority: b.seniority as SeniorityLevel,
      postType: b.postType as PostType,
      keySkills: (b.keySkills as string).trim(),
      context: typeof b.context === "string" ? b.context.trim() || undefined : undefined,
    };
  }

  if (b.mode === "candidate") {
    if (typeof b.companyName !== "string" || b.companyName.trim().length < 2)
      return { error: "Nom d'entreprise trop court" };
    if (typeof b.jobTitle !== "string" || b.jobTitle.trim().length < 3)
      return { error: "Poste visé trop court" };
    if (!VALID_PRIORITY.includes(b.priority as CandidatePriority))
      return { error: "Axe prioritaire invalide" };
    return {
      mode: "candidate",
      companyName: (b.companyName as string).trim(),
      jobTitle: (b.jobTitle as string).trim(),
      priority: b.priority as CandidatePriority,
      jobUrl: typeof b.jobUrl === "string" ? b.jobUrl.trim() || undefined : undefined,
    };
  }

  return { error: "Mode invalide" };
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed, count, limit } = await checkRateLimit(user.id, supabase);
  if (!allowed)
    return NextResponse.json(
      { error: "Limite de requêtes atteinte", details: `${count}/${limit} requêtes utilisées.` },
      { status: 429 },
    );

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const validated = validate(body);
  if ("error" in validated) return NextResponse.json(validated, { status: 400 });

  let systemPrompt: string;
  if (validated.mode === "recruiter") {
    systemPrompt = buildRecruiterSystemPrompt({
      jobTitle: validated.jobTitle,
      seniority: validated.seniority,
      postType: validated.postType,
      keySkills: validated.keySkills,
      context: validated.context,
    });
  } else {
    if (validated.jobUrl && !isSafeUrl(validated.jobUrl)) {
      return NextResponse.json({ error: "URL de fiche de poste invalide" }, { status: 400 });
    }
    const jobListingContent = validated.jobUrl ? await fetchJobListing(validated.jobUrl) : undefined;
    systemPrompt = buildCandidateSystemPrompt({
      companyName: validated.companyName,
      jobTitle: validated.jobTitle,
      priority: validated.priority,
      jobListingContent,
    });
  }

  try {
    const message = await getAnthropicClient().messages.create({
      model: MODEL_ID,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: "Génère le guide pour le contexte fourni." }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text")
      return NextResponse.json({ error: "Réponse vide de l'IA" }, { status: 502 });

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(textBlock.text));
    } catch (e) {
      return NextResponse.json(
        { error: "Réponse mal formatée", details: e instanceof Error ? e.message : String(e) },
        { status: 502 },
      );
    }

    await recordUsage(user.id, "recruitment", supabase);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json(
      { error: "Échec de l'appel à l'IA", details: e instanceof Error ? e.message : "Erreur inconnue" },
      { status: 502 },
    );
  }
}
