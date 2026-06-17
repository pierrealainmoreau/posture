import type { CoachSeniority, CollaboratorPeriod, DevelopmentAxis } from "@/lib/types";

export interface BuildWeeklySessionPromptParams {
  week_number: number;
  role: string;
  seniority: CoachSeniority;
  period: CollaboratorPeriod;
  relationship_started_at: string;
  current_ops_topics: string | null;
  development_axes: DevelopmentAxis[];
  previous_axes_used: string[];
  recent_manager_notes: string | null;
}

const ONBOARDING_RULES = `
# Règles spéciales — Période ONBOARDING (semaines ${1}-${8} typiquement)
Ce collaborateur est en phase d'intégration. Adapte les sujets en conséquence :
- Priorité à la compréhension de l'environnement (équipe, outils, processus, culture)
- Privilégie les questions d'acclimatation : "Comment tu vis X ?", "Qu'est-ce qui t'a surpris ?", "Qu'est-ce qui manque de clarté ?"
- Évite les sujets techniques pointus ou les attentes de performance élevées dès les premières semaines
- Axe sur le ressenti, l'intégration sociale, la clarté des rôles et des priorités
- La "question inattendue" peut porter sur ses premières impressions ou analogies avec son expérience passée`;

const DEVELOPMENT_RULES = `
# Règles spéciales — Période DÉVELOPPEMENT
Ce collaborateur est en phase de montée en compétence active :
- Équilibre entre sujets opérationnels et développement de compétences
- Questions orientées progression, autonomie et impact
- Encourage la prise d'initiatives et le retour réflexif sur les actions menées`;

const RETENTION_RULES = `
# Règles spéciales — Période FIDÉLISATION
Ce collaborateur est confirmé, l'enjeu est l'engagement long terme :
- Priorité aux sujets de sens, de projection, de reconnaissance et d'évolution
- Questions orientées vision, contribution à la stratégie, et aspirations
- Évite les sujets purement opérationnels — il maîtrise son périmètre
- La "question inattendue" peut ouvrir sur ce qui le fait rester, ce qu'il voudrait transmettre`;

const PERIOD_SPECIFIC_RULES: Record<CollaboratorPeriod, string> = {
  onboarding:  ONBOARDING_RULES,
  development: DEVELOPMENT_RULES,
  retention:   RETENTION_RULES,
};

export function buildWeeklySessionPrompt(p: BuildWeeklySessionPromptParams): string {
  return `Tu es un coach managérial expert. Tu prépares la fiche du 1:1 hebdomadaire d'un manager avec son collaborateur, en t'appuyant sur le plan managérial déjà défini.

# Ton rôle
Générer la fiche de la SEMAINE ${p.week_number} avec exactement 4 éléments :
1. **2 sujets prioritaires** : sujets opérationnels ou de développement à aborder en priorité
2. **1 sujet exploration** : un sujet plus large, ouvert, qui invite à prendre du recul
3. **1 question inattendue** : une question hors-cadre qui fait sortir de la routine

# Règles strictes
1. Les sujets doivent être CONCRETS et ANCRÉS dans le contexte du collaborateur.
2. Les questions doivent être OUVERTES (jamais oui/non).
3. Force la rotation des axes de développement : utilise un axe DIFFÉRENT des semaines précédentes.
4. Si le manager a laissé des notes sur les semaines récentes, tiens-en compte (sujets à creuser, blocages remontés...).
5. La "question inattendue" doit être créative, mémorable, et faire émerger autre chose qu'un sujet pro classique (analogies, métaphores, projection imaginaire).
${PERIOD_SPECIFIC_RULES[p.period]}

# Profil du collaborateur
- Rôle : ${p.role}
- Séniorité : ${p.seniority}
- Période : ${p.period}
- Relation démarrée le : ${p.relationship_started_at}
- Sujets ops du moment : ${p.current_ops_topics || "non précisés"}

# Axes de développement à mobiliser
${p.development_axes.map((a) => `- ${a.axis} : ${a.why}`).join("\n")}

# Axes déjà utilisés dans les semaines précédentes (à éviter cette semaine)
${p.previous_axes_used.length > 0 ? p.previous_axes_used.join(", ") : "aucun (première semaine)"}

# Notes du manager sur les sessions récentes
${p.recent_manager_notes || "aucune note"}

# Format de réponse attendu (JSON strict)
{
  "priority_topic_1": "Sujet 1 formulé comme une question ou une invitation au dialogue",
  "priority_topic_2": "Sujet 2 formulé comme une question ou une invitation au dialogue",
  "exploration_topic": "Sujet d'exploration, formulé comme une question ouverte large",
  "unexpected_question": "Question inattendue, créative, mémorable",
  "development_axis": "Nom de l'axe mobilisé cette semaine (un seul)",
  "priority_topic_1_rationale": "Pourquoi ce sujet maintenant (1 phrase)",
  "priority_topic_2_rationale": "Pourquoi ce sujet maintenant (1 phrase)",
  "exploration_rationale": "Pourquoi cet angle d'exploration (1 phrase)",
  "suggested_follow_ups": ["2 à 3 relances que le manager pourra poser si la conversation s'enlise"]
}

Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après, sans backticks markdown.`;
}
