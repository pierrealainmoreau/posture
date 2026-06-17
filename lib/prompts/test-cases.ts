/**
 * Suite de cas de test qualitatifs pour itérer sur le prompt système.
 *
 * USAGE : ces cas servent à valider manuellement la qualité des feedbacks
 * générés. À chaque évolution du prompt, on relance ces cas et on note
 * ce qui régresse ou s'améliore. C'est un proxy léger d'une vraie suite
 * d'évals — adapté à un projet personnel.
 */

import type { FeedbackRequest } from "@/lib/types";

export interface TestCase {
  id: string;
  description: string;
  request: FeedbackRequest;
  expected_qualities: string[];
  expected_warnings?: string[];
}

export const FEEDBACK_TEST_CASES: TestCase[] = [
  {
    id: "case-01-interruption-client",
    description: "Comportement répété en réunion client, ton direct, format oral",
    request: {
      context:
        "Lors de la réunion client de mardi, Paul a interrompu à plusieurs reprises la cliente qui présentait son besoin. Elle m'a appelé après pour exprimer son malaise. C'est la deuxième fois ce mois-ci.",
      type: "corrective",
      tone: "direct",
      format: "oral_1on1",
    },
    expected_qualities: [
      "Mentionne les faits sans jugement de personnalité",
      "Quantifie (3 interruptions, 2 fois ce mois-ci)",
      "Termine par une question ouverte",
      "Ne dit pas 'tu es irrespectueux'",
    ],
  },
  {
    id: "case-02-positif-livraison",
    description: "Reconnaissance d'un super travail, ton bienveillant, format Slack",
    request: {
      context:
        "Léa a livré la refonte du module de paiement avec deux jours d'avance, et l'équipe QA n'a remonté aucun bug critique. Elle a aussi spontanément documenté son code.",
      type: "positive",
      tone: "caring",
      format: "written_slack",
    },
    expected_qualities: [
      "Précis sur les comportements valorisés (avance, qualité, doc spontanée)",
      "Court, format Slack",
      "Évite le compliment générique 'super travail'",
    ],
  },
  {
    id: "case-03-jugement-personnalite",
    description: "Le manager utilise un jugement de personnalité dans son input — l'outil doit alerter",
    request: {
      context:
        "Marc est paresseux. Il rend toujours ses dossiers en retard et ne prend aucune initiative.",
      type: "corrective",
      tone: "caring",
      format: "oral_1on1",
    },
    expected_qualities: [
      "Le feedback généré ne contient pas 'paresseux' ni 'toujours'",
      "Demande des faits concrets dans missing_context",
    ],
    expected_warnings: [
      "Détecte 'paresseux' comme jugement de personnalité",
      "Détecte 'toujours' comme généralisation",
    ],
  },
  {
    id: "case-04-conflit-equipe",
    description: "Conflit interpersonnel, ton coaching, format oral",
    request: {
      context:
        "En rétrospective d'équipe vendredi, Sophie a coupé la parole à Tom à trois reprises et a dit 'tu ne comprends rien à l'archi'. L'ambiance s'est tendue, deux personnes m'ont fait remonter leur gêne.",
      type: "corrective",
      tone: "coaching",
      format: "oral_1on1",
    },
    expected_qualities: [
      "Pose des questions plus que des affirmations (mode coaching)",
      "Ne prend pas parti pour Tom",
      "Mentionne l'impact sur l'équipe, pas seulement sur Tom",
    ],
  },
  {
    id: "case-05-contexte-flou",
    description: "Manager qui décrit trop vaguement — l'outil doit demander des précisions",
    request: {
      context: "Julien n'est pas au niveau.",
      type: "corrective",
      tone: "direct",
      format: "oral_1on1",
    },
    expected_qualities: [
      "missing_context contient des questions pour préciser",
      "Le feedback généré est explicitement marqué comme préliminaire",
    ],
    expected_warnings: [
      "Détecte 'pas au niveau' comme jugement vague et non actionnable",
    ],
  },
  {
    id: "case-06-mixte-annuel",
    description: "Feedback mixte pour un entretien annuel, format email",
    request: {
      context:
        "Sur l'année, Aïcha a porté avec succès le projet de migration cloud (livré dans les délais, budget respecté). En revanche, elle a tendance à travailler en silo et n'a pas formé suffisamment l'équipe sur les nouvelles technologies, ce qui crée un point de fragilité.",
      type: "mixed",
      tone: "caring",
      format: "written_email",
    },
    expected_qualities: [
      "Reconnaît le succès ET pointe l'axe d'amélioration sans diluer",
      "Format email avec objet",
      "Pas de 'sandwich' mécanique (positif/négatif/positif)",
    ],
  },
];
