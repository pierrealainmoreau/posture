import type { CoachSeniority, CollaboratorPeriod } from "@/lib/types";

const CADENCE_DURATION: Record<CoachSeniority, string> = {
  junior:    "1h",
  confirmed: "45 min",
  senior:    "30 min",
};

interface ProfileContext {
  role: string;
  seniority: CoachSeniority;
  period: CollaboratorPeriod;
  relationship_started_at: string;
  current_ops_topics: string | null;
}

const PERIOD_LABELS: Record<CollaboratorPeriod, string> = {
  onboarding:  "Onboarding (nouveau dans le poste)",
  development: "Développement (montée en compétence active)",
  retention:   "Fidélisation (collaborateur confirmé, engagement long terme)",
};

function profileBlock(p: ProfileContext): string {
  return `- Rôle : ${p.role}
- Séniorité : ${p.seniority}
- Période : ${PERIOD_LABELS[p.period]}
- Relation démarrée le : ${p.relationship_started_at}
- Sujets opérationnels du moment : ${p.current_ops_topics || "non précisés"}`;
}

// ── Étape 1 : Axes de développement ────────────────────────────────────────

export function buildStep1AxesPrompt(p: ProfileContext): string {
  return `Tu es un coach managérial expert. Ton rôle : identifier les axes de développement prioritaires pour ce collaborateur.

# Profil
${profileBlock(p)}

# Axes disponibles (choisis 2 à 4 qui correspondent le mieux à ce profil)
- Compétences : montée en expertise technique ou métier
- Autonomie : capacité à prendre des décisions seul
- Impact : effet sur l'organisation, l'équipe, le produit
- Motivation : énergie, sens, plaisir au travail
- Visibilité : reconnaissance interne et externe
- Collaboration : qualité des relations avec les autres
- Leadership : capacité à entraîner, mentorer
- Apprentissage : posture d'apprenant, curiosité

# Règles
- Choisis uniquement les axes pertinents pour CE collaborateur (séniorité, rôle, contexte).
- Justifie chaque choix en 1-2 phrases concrètes. Pas de généralités.

# Format JSON strict
{
  "axes": [
    { "axis": "Nom de l'axe", "why": "Justification concrète en 1-2 phrases" }
  ]
}

Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après, sans backticks.`;
}

// ── Étape 2 : Cadence & attentes mutuelles ─────────────────────────────────

export function buildStep2CadencePrompt(p: ProfileContext, axes: string[]): string {
  const duration = CADENCE_DURATION[p.seniority];
  return `Tu es un coach managérial expert. En te basant sur le profil de ce collaborateur et ses axes de développement, définis la structure de la relation managériale.

# Profil
${profileBlock(p)}

# Axes de développement retenus
${axes.map((a) => `- ${a}`).join("\n")}

# Règle sur la cadence (NON NÉGOCIABLE)
La cadence est TOUJOURS hebdomadaire. La durée est fixée par la séniorité :
- junior → 1h (accompagnement rapproché, nombreux points à structurer)
- confirmed → 45 min (équilibre entre suivi et autonomie)
- senior → 30 min (collaborateur autonome, échanges ciblés et efficaces)
Pour ce profil (${p.seniority}), la durée est : ${duration}.
Le champ "proposed_cadence" doit commencer par "1:1 hebdomadaire — ${duration}" puis une justification courte liée à la séniorité et à la période.

# Ce que tu dois produire
1. La cadence (hebdomadaire — ${duration}) avec justification courte
2. Les attentes mutuelles à poser dès le premier entretien (synthèse en 3-5 phrases)
3. Une phrase d'introduction chaleureuse que le manager peut lire au début du premier 1:1 (2-3 lignes)
4. 3 à 5 attentes que le manager peut formuler à voix haute
5. 3 à 5 questions à poser au collaborateur pour faire émerger ses propres attentes
6. 2 à 3 risques managériaux concrets à surveiller dans cette relation

# Règles générales
- Tout doit être actionnable et ancré dans le contexte fourni.
- Le "tu" s'adresse au manager.
- Tiens compte de la période (${PERIOD_LABELS[p.period]}) dans le ton et les attentes.

# Format JSON strict
{
  "proposed_cadence": "1:1 hebdomadaire — ${duration} + justification (1 phrase)",
  "mutual_expectations": "Synthèse des attentes mutuelles (3-5 phrases)",
  "intro": "Phrase d'intro pour le premier 1:1 (2-3 lignes)",
  "expectations_manager_to_collaborator": ["3 à 5 attentes concrètes"],
  "expectations_collaborator_to_manager": ["3 à 5 questions à poser"],
  "risks_to_watch": ["2 à 3 risques concrets"]
}

Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après, sans backticks.`;
}

// ── Étape 3 : Questions par axe ────────────────────────────────────────────


export function buildStep3QuestionsPrompt(
  p: ProfileContext,
  axes: Array<{ axis: string; why: string }>,
): string {
  return `Tu es un coach managérial expert. Pour chaque axe de développement listé, génère des questions ouvertes que le manager posera lors des 1:1 hebdomadaires.

# Profil du collaborateur
${profileBlock(p)}

# Axes de développement (avec leur contexte)
${axes.map((a) => `- ${a.axis} : ${a.why}`).join("\n")}

# Règles
- 3 à 5 questions par axe.
- Questions ouvertes uniquement (jamais oui/non).
- Concrètes et adaptées au rôle et à la séniorité.
- Variées : certaines explorent le ressenti, d'autres les faits, d'autres la projection.

# Format JSON strict
{
  "questions_by_axis": {
    "Nom exact de l'axe": ["question 1", "question 2", "question 3"]
  }
}

Les clés doivent correspondre EXACTEMENT aux noms d'axes fournis.
Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après, sans backticks.`;
}

// ── Étape 4 : Career path ──────────────────────────────────────────────────

export function buildStep4CareerPathPrompt(p: ProfileContext): string {
  return `Tu es un coach managérial expert. Établis le career path de ce collaborateur en identifiant ses compétences clés actuelles et les niveaux cibles à 6-12 mois.

# Profil
${profileBlock(p)}

# Niveaux disponibles (ordre croissant)
débutant → intermédiaire → avancé → expert

# Ce que tu dois produire
- 4 à 6 soft skills pertinentes pour ce rôle et cette séniorité, avec niveau actuel estimé, niveau cible, et exemple d'exigence
- 4 à 6 hard skills pertinentes pour ce rôle et cette séniorité, avec niveau actuel estimé, niveau cible, et exemple d'exigence

# Règles
- Choisis des compétences spécifiques au rôle (pas des généralités comme "communication")
- Le niveau actuel doit être cohérent avec la séniorité déclarée
- Le niveau cible doit être réaliste sur 6-12 mois (max +1 niveau)
- Pour "expectation" : décris en 1 phrase courte et concrète ce qui distingue le niveau cible du niveau juste en dessous, pour CETTE compétence et CE rôle. Commence par un verbe à l'infinitif. Exemple : "Conduire des revues de code en autonomie et identifier des patterns d'architecture."

# Format JSON strict
{
  "soft_skills": [
    { "skill": "Nom précis", "level": "niveau actuel", "target": "niveau cible", "expectation": "Ce qui est attendu au niveau cible (1 phrase, verbe à l'infinitif)" }
  ],
  "hard_skills": [
    { "skill": "Nom précis", "level": "niveau actuel", "target": "niveau cible", "expectation": "Ce qui est attendu au niveau cible (1 phrase, verbe à l'infinitif)" }
  ]
}

Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après, sans backticks.`;
}
