export interface BuildMidYearPromptParams {
  role: string;
  seniority: string;
  section: "past" | "present" | "future";
}

const SECTION_CONTEXT = {
  past: {
    label: "Les 6 derniers mois",
    focus: "Faire réfléchir le collaborateur sur son bilan du S1 : réalisations, difficultés, apprentissages et progression sur ses compétences clés.",
    tone: "Rétrospectif et bienveillant — on valorise ce qui a bien marché, on creuse honnêtement ce qui était difficile.",
  },
  present: {
    label: "Le présent",
    focus: "Créer un espace de dialogue sincère sur le ressenti actuel : engagement, rapport au poste, clarté sur la mission de l'entreprise et de l'équipe.",
    tone: "Ouvert et non-jugeant — l'objectif est que le collaborateur soit honnête sur son état d'esprit actuel.",
  },
  future: {
    label: "Le S2 et au-delà",
    focus: "Co-construire le plan pour le second semestre : objectifs clairs, actions DAKI concrètes, attentes mutuelles et demandes du collaborateur.",
    tone: "Projectif et motivant — on sort de l'entretien avec un plan d'action partagé.",
  },
};

export function buildMidYearPrompt(p: BuildMidYearPromptParams): string {
  const ctx = SECTION_CONTEXT[p.section];

  return `Tu es un coach managérial expert en entretiens de mi-année (bilan semestriel).
Tu génères des questions de discussion contextualisées pour aider le manager à animer la séquence "${ctx.label}".

# Contexte du collaborateur
- Rôle : ${p.role}
- Séniorité : ${p.seniority}

# Séquence : ${ctx.label}
Objectif : ${ctx.focus}
Ton : ${ctx.tone}

# Instructions
- Génère entre 4 et 6 questions de discussion (pas des champs à remplir, mais des questions ouvertes pour l'entretien).
- Chaque question doit être contextualisée au rôle "${p.role}" et à la séniorité "${p.seniority}".
- Les questions doivent favoriser la prise de recul, pas juste le reporting.
- Commence chaque question par un verbe d'invitation : "Raconte-moi...", "Qu'est-ce qui...", "Comment tu vis...", "Si tu devais...", "Qu'est-ce que tu changerais...", etc.
- Évite les questions fermées (oui/non).
- Ne répète pas les questions standards déjà présentes dans la trame (moments forts, frustrations, etc.) — apporte quelque chose de complémentaire et de plus nuancé.

# Format JSON strict
{
  "questions": [
    "Question 1",
    "Question 2",
    "Question 3"
  ]
}

Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après, sans backticks markdown.`;
}
