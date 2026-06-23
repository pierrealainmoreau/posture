import type { CollaboratorOkr, WeeklySession } from "@/lib/types";

export type SyntheseType = "resultats" | "ressources" | "blocage" | "rh" | "general";
export type SyntheseDestinataire = "n1" | "drh" | "codir";

export interface CollabSnapshot {
  first_name: string;
  last_name: string;
  role: string;
  seniority: string;
  period: string;
  current_ops_topics: string | null;
  okr: Pick<CollaboratorOkr, "objective" | "key_results"> | null;
  recent_sessions: Pick<
    WeeklySession,
    "week_number" | "priority_topic_1" | "priority_topic_2" | "manager_notes" | "is_completed"
  >[];
}

export interface BuildSynthesePromptParams {
  collaborators: CollabSnapshot[];
  type: SyntheseType;
  destinataire: SyntheseDestinataire;
  context: string;
}

const TYPE_GUIDANCE: Record<SyntheseType, string> = {
  resultats:
    "Synthèse des résultats et avancement des OKR. Mets en avant les réussites, les indicateurs clés et la dynamique de l'équipe.",
  ressources:
    "Demande de ressources (budget, recrutement, outils, temps). Argumente avec les données de l'équipe, quantifie le besoin et l'impact attendu.",
  blocage:
    "Alerte / escalade. Structure clairement : situation → impact → blocage identifié → ce dont tu as besoin. Ton factuel, pas émotionnel.",
  rh:
    "Situation RH sensible (tension, départ, sous-performance, risque). Ton sobre, factuel, sans jugement. Focus sur les faits observables et les risques.",
  general:
    "Point d'étape global. Vue équilibrée de l'équipe : ce qui va bien, ce qui est en tension, perspectives.",
};

const DESTINATAIRE_GUIDANCE: Record<SyntheseDestinataire, string> = {
  n1: `Ton direct et opérationnel. Tu peux entrer dans les détails. Structure lisible mais sans cérémonie excessive.
Le N+1 connaît le contexte — pas besoin de tout réexpliquer, va à l'essentiel et aux faits nouveaux.`,
  drh: `Ton formel et factuel. Priorité aux éléments RH : montée en compétence, engagement, risques de départ, signaux faibles.
Évite le jargon produit ou technique. La DRH a besoin de comprendre la situation humaine, pas les métriques business.`,
  codir: `Format exécutif : headline d'abord, détails ensuite. Max 5 bullet points clés.
Pas de détails individuels — parle au niveau équipe. Relie toujours à l'impact business ou stratégique.
Commence par une phrase d'accroche qui résume l'essentiel en une ligne.`,
};

const PERIOD_LABELS: Record<string, string> = {
  onboarding: "en phase d'intégration",
  development: "en progression",
  retention: "profil confirmé à fidéliser",
};

function formatCollabSnapshot(c: CollabSnapshot): string {
  const period = PERIOD_LABELS[c.period] ?? c.period;
  const lines: string[] = [
    `### ${c.first_name} ${c.last_name} — ${c.role} (${c.seniority}, ${period})`,
  ];

  if (c.current_ops_topics) {
    lines.push(`Sujets opérationnels en cours : ${c.current_ops_topics}`);
  }

  if (c.okr) {
    lines.push(`OKR actuel : ${c.okr.objective}`);
    if (c.okr.key_results.length > 0) {
      const krs = c.okr.key_results
        .map((kr) => {
          const progress = kr.current ? ` (actuel : ${kr.current} ${kr.unit} / cible : ${kr.target} ${kr.unit})` : ` (cible : ${kr.target} ${kr.unit})`;
          return `  - ${kr.label}${progress}`;
        })
        .join("\n");
      lines.push(`Key Results :\n${krs}`);
    }
  } else {
    lines.push("OKR : non défini");
  }

  if (c.recent_sessions.length > 0) {
    lines.push("Sessions 1:1 récentes :");
    for (const s of c.recent_sessions) {
      const status = s.is_completed ? "complétée" : "en cours";
      lines.push(`  Semaine ${s.week_number} (${status}) :`);
      lines.push(`    - ${s.priority_topic_1}`);
      lines.push(`    - ${s.priority_topic_2}`);
      if (s.manager_notes) {
        lines.push(`    Notes manager : ${s.manager_notes}`);
      }
    }
  } else {
    lines.push("Sessions 1:1 : aucune enregistrée");
  }

  return lines.join("\n");
}

export function buildSyntheseSystemPrompt({
  collaborators,
  type,
  destinataire,
  context,
}: BuildSynthesePromptParams): string {
  const collabSection = collaborators.map(formatCollabSnapshot).join("\n\n");

  return `Tu es un coach managérial expert. Tu aides des managers à rédiger des notes de synthèse claires et percutantes à destination de leur hiérarchie.

# Ton rôle
Transformer les données d'une équipe (collaborateurs, OKR, sessions 1:1) en une note de synthèse structurée, prête à être envoyée ou partagée.

# Données de l'équipe
${collabSection}

${context.trim() ? `# Contexte supplémentaire fourni par le manager\n${context.trim()}\n` : ""}
# Type de note
${type} — ${TYPE_GUIDANCE[type]}

# Destinataire
${destinataire} — ${DESTINATAIRE_GUIDANCE[destinataire]}

# Structure de la note à produire
Rédige une note de synthèse avec les sections suivantes (adapte le contenu et la profondeur selon le destinataire) :

**Objet :** [titre concis en une ligne]

**Contexte**
[1 à 2 phrases situant la note — période, équipe concernée, objet]

**Équipe concernée**
[Pour chaque collaborateur inclus : prénom, rôle, situation actuelle en 1 ligne. CODIR = niveau équipe uniquement, pas d'individus.]

**Points clés**
[3 à 5 bullet points des éléments principaux à retenir selon le type de brief]

**Avancement OKR**
[Si des OKR sont définis et pertinents pour ce type de brief. Sinon, omets cette section.]

**Points d'attention**
[Risques, tensions, signaux faibles. Omets si rien à signaler.]

**Prochaine étape / Demande**
[Ce que le manager attend du destinataire, ou l'action prévue. 1 à 2 phrases max.]

# Règles
1. Reste factuel — jamais de jugement de personnalité sur les collaborateurs.
2. Adapte le niveau de détail au destinataire : CODIR = synthétique et stratégique, N+1 = opérationnel, DRH = angle humain.
3. Si des données manquent (OKR non définis, pas de sessions), ne les invente pas — mentionne-le ou omets la section.
4. Ton professionnel, sobre. Pas de formules de politesse superflues.

# Format de réponse attendu (JSON strict)
{
  "note": "La note de synthèse complète, en Markdown (gras pour les titres de sections, bullet points avec -)",
  "warnings": ["Alertes optionnelles si tu détectes un problème ou un manque de données critiques. Tableau vide [] si rien à signaler."]
}

Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après, sans backticks markdown, sans commentaires.`;
}
