export interface ManualQuestion {
  id: string;
  label: string;
  placeholder?: string;
}

export interface ManualSection {
  id: string;
  emoji: string;
  title: string;
  questions: ManualQuestion[];
}

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: "fonctionnement",
    emoji: "🧠",
    title: "Ma façon de fonctionner",
    questions: [
      {
        id: "batteries",
        label: "Comment je recharge mes batteries ?",
        placeholder: "Seul·e, en échangeant, en bougeant…",
      },
      {
        id: "efficacite",
        label: "À quels moments de la journée suis-je le plus efficace ?",
        placeholder: "Matin, après-midi, tard le soir…",
      },
      {
        id: "decisions",
        label: "Comment je prends mes décisions",
        placeholder: "Intuition, données, discussion avec d'autres ?",
      },
    ],
  },
  {
    id: "communication",
    emoji: "💬",
    title: "Communication",
    questions: [
      {
        id: "canal",
        label: "Quel est mon canal préféré selon l'urgence ?",
        placeholder: "Slack pour l'urgent, email pour le non-urgent, de vive voix pour les sujets complexes…",
      },
      {
        id: "feedback",
        label: "Comment je préfère recevoir du feedback ?",
        placeholder: "En direct, en privé, par écrit d'abord, avec un délai après l'événement…",
      },
      {
        id: "entendu",
        label: "Qu'est-ce qui me fait me sentir entendu·e dans une conversation ?",
        placeholder: "Qu'on reformule ce que je dis, qu'on me laisse finir mes phrases, qu'on prend des notes…",
      },
    ],
  },
  {
    id: "collaboration",
    emoji: "🤝",
    title: "Collaboration",
    questions: [
      {
        id: "reunion",
        label: "Comment je fonctionne en réunion",
        placeholder: "Je prépare en amont, j'improvise, j'ai besoin de temps de réflexion après…",
      },
      {
        id: "aide",
        label: "Ce que j'attends d'un·e collègue quand je demande de l'aide",
        placeholder: "Qu'on m'aide à débloquer sans faire à ma place, qu'on me pose des questions pour que je trouve moi-même…",
      },
      {
        id: "collectif",
        label: "Ce qui me motive à m'investir dans un projet collectif",
        placeholder: "Le sens du projet, l'ambiance d'équipe, les défis à relever ensemble, l'impact visible…",
      },
    ],
  },
  {
    id: "freins",
    emoji: "⚡",
    title: "Ce qui me freine ou m'agace",
    questions: [
      {
        id: "irritants",
        label: "Mes irritants au travail",
        placeholder: "Interruptions fréquentes, flou dans les objectifs, micromanagement…",
      },
      {
        id: "pression",
        label: "Signes que je suis sous pression — et comment m'aider dans ces moments-là",
        placeholder: "Je deviens plus silencieux·se, j'évite les réunions… Dans ces moments, le mieux est de…",
      },
      {
        id: "interdits",
        label: "Ce qu'il ne faut surtout pas faire avec moi",
        placeholder: "Me couper la parole, changer les règles en cours de route, le flou sur les priorités…",
      },
    ],
  },
  {
    id: "apports",
    emoji: "🌟",
    title: "Ce que j'apporte & ce dont j'ai besoin",
    questions: [
      {
        id: "forces",
        label: "Mes forces sur lesquelles mes collègues peuvent compter",
        placeholder: "Je suis fiable sur les délais, je fédère bien, je simplifie les problèmes complexes…",
      },
      {
        id: "soutien",
        label: "Ce dans quoi j'ai besoin d'être soutenu·e ou challengé·e",
        placeholder: "Prendre la parole en public, structurer mes idées à l'écrit, gérer les conflits…",
      },
      {
        id: "amour",
        label: "Ma \"langue de l'amour\" au travail",
        placeholder: "Reconnaissance verbale, autonomie, défis intellectuels, responsabilités…",
      },
    ],
  },
  {
    id: "divers",
    emoji: "💡",
    title: "Divers",
    questions: [
      {
        id: "surprise",
        label: "Un fait surprenant sur moi que peu de collègues savent",
        placeholder: "J'ai vécu dans 4 pays, je fais de la poterie, j'ai travaillé en ONG avant le privé…",
      },
      {
        id: "conseil",
        label: "Ce que j'aurais aimé qu'on me dise en arrivant dans l'équipe",
        placeholder: "Que les réunions du vendredi sont facultatives, que Dupont est la personne-clé à connaître…",
      },
    ],
  },
];
