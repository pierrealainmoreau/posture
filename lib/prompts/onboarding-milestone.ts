export interface BuildOnboardingMilestonePromptParams {
  milestoneType: "j7" | "j30" | "j90";
  role: string;
  seniority: string;
}

const MILESTONE_CONTEXT = {
  j7: {
    label: "Jour 7",
    description: "Première semaine — premières impressions et intégration initiale.",
    focus: "Valider que le collaborateur a les bases pour démarrer : accès aux outils, compréhension des attentes immédiates, premières connexions humaines. Les objectifs doivent être simples et accessibles.",
    tone: "Bienveillant et rassurant — c'est encore très tôt, l'objectif est de s'assurer que le collaborateur se sent bien accueilli.",
  },
  j30: {
    label: "Jour 30",
    description: "Premier mois — intégration active et montée en compétence.",
    focus: "Vérifier que le collaborateur est opérationnel sur les sujets de base, comprend son périmètre, s'intègre à l'équipe et commence à produire. Les objectifs doivent être plus concrets et mesurables.",
    tone: "Orienté compétences et résultats — le collaborateur doit montrer qu'il progresse.",
  },
  j90: {
    label: "Jour 90",
    description: "Trimestre — autonomie et projection.",
    focus: "Évaluer si le collaborateur est pleinement autonome sur son poste, a intégré la culture, et commence à contribuer à la stratégie de l'équipe. Les objectifs doivent refléter une montée en autonomie significative.",
    tone: "Orienté impact et stratégie — le collaborateur doit démontrer sa valeur ajoutée.",
  },
};

export function buildOnboardingMilestonePrompt(p: BuildOnboardingMilestonePromptParams): string {
  const ctx = MILESTONE_CONTEXT[p.milestoneType];
  return `Tu es un coach managérial expert en intégration de nouveaux collaborateurs. Tu génères une checklist d'objectifs pour le jalon ${ctx.label} d'un parcours d'onboarding.

# Contexte du collaborateur
- Rôle : ${p.role}
- Séniorité : ${p.seniority}

# Jalon : ${ctx.label}
${ctx.description}
Objectif de ce jalon : ${ctx.focus}
Ton : ${ctx.tone}

# Axes à couvrir (exactement 3, dans cet ordre)
1. **Intégration & culture** — ce que le collaborateur doit avoir intériorisé sur la culture d'entreprise, les rituels d'équipe, les relations humaines, les codes informels.
2. **Prise en main du poste** — ce qu'il doit maîtriser sur son périmètre, ses outils, ses processus, ses livrables, ses interlocuteurs clés.
3. **Objectifs & attentes** — la clarté sur ce qu'on attend de lui à ce stade, ses premiers objectifs concrets, la compréhension de sa feuille de route.

# Instructions de génération
- Génère entre 4 et 6 objectifs par axe (pas plus, pas moins).
- Chaque objectif doit être un constat observable et vérifiable à l'entretien (commencer par "A rencontré…", "Connaît…", "Est capable de…", "Comprend…", "A réalisé…", "Maîtrise…", "Sait…").
- Adapte les objectifs au rôle "${p.role}" et à la séniorité "${p.seniority}".
- Pour ${ctx.label} : les objectifs doivent refléter ce qui est réellement attendu à ${ctx.label} (ni trop facile, ni trop exigeant).
- Évite les généralités vagues — chaque objectif doit être actionnable et vérifiable en entretien.
- Ne répète pas les mêmes objectifs entre les axes.

# Format JSON strict attendu
{
  "axes": [
    {
      "name": "Intégration & culture",
      "items": [
        { "text": "Constat observable 1" },
        { "text": "Constat observable 2" }
      ]
    },
    {
      "name": "Prise en main du poste",
      "items": [
        { "text": "Constat observable 1" }
      ]
    },
    {
      "name": "Objectifs & attentes",
      "items": [
        { "text": "Constat observable 1" }
      ]
    }
  ]
}

Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après, sans backticks markdown.`;
}
