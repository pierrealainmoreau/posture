import type { QuizQuestion } from "@/lib/types";

export const QUIZ_CONFIG = {
  questionsPerSession: 5,
  timerSeconds: 20,
} as const;

/**
 * Banque de questions sur la Communication Non Violente (CNV).
 * Source pédagogique : méthode CNV de Marshall Rosenberg (OSBD).
 * L'index 0 de chaque tableau "options" est toujours la bonne réponse.
 * Les options seront mélangées à l'affichage via shuffle().
 */
export const CNV_QUESTIONS: QuizQuestion[] = [
  {
    id: "cnv-01",
    question: "Quelle phrase est une OBSERVATION au sens de la CNV ?",
    options: [
      "Tu es arrivé après 9h30 trois fois cette semaine.",
      "Tu n'es jamais à l'heure.",
      "Tu te fiches complètement des horaires.",
      "Tu manques de respect à l'équipe par tes retards.",
    ],
    explanation:
      "Une observation CNV est factuelle, datée, quantifiable. Les trois autres formulations sont des jugements ou des interprétations.",
    theme: "Observation",
  },
  {
    id: "cnv-02",
    question: "Lequel de ces énoncés exprime un SENTIMENT au sens CNV ?",
    options: [
      "Je me sens frustré.",
      "Je me sens trahi par toi.",
      "Je sens que tu ne m'écoutes pas.",
      "J'ai l'impression que tu te moques de moi.",
    ],
    explanation:
      "Un sentiment CNV est un état intérieur, sans accusation déguisée. 'Trahi' implique une action d'autrui. 'Tu ne m'écoutes pas' et 'tu te moques' sont des interprétations, pas des sentiments.",
    theme: "Sentiment",
  },
  {
    id: "cnv-03",
    question:
      "Vous voulez exprimer un BESOIN à votre collaborateur. Quelle formulation est juste ?",
    options: [
      "J'ai besoin de clarté sur la priorité des tâches.",
      "J'ai besoin que tu sois plus organisé.",
      "J'ai besoin que tu changes d'attitude.",
      "J'ai besoin que tu fasses des efforts.",
    ],
    explanation:
      "Un besoin CNV est universel et ne dépend pas d'une action précise de l'autre. Les trois autres formulations sont des demandes déguisées en besoins.",
    theme: "Besoin",
  },
  {
    id: "cnv-04",
    question: "Qu'est-ce qu'une DEMANDE en CNV ?",
    options: [
      "Une action concrète, positive, négociable, formulée au présent.",
      "Une exigence claire qui ne laisse pas place à la discussion.",
      "Une suggestion vague que l'autre interprète comme il veut.",
      "Un reproche reformulé en question rhétorique.",
    ],
    explanation:
      "Une demande CNV est concrète ('peux-tu m'envoyer le rapport avant 17h ?'), formulée positivement, et reste négociable — sinon c'est une exigence.",
    theme: "Demande",
  },
  {
    id: "cnv-05",
    question:
      "Un collaborateur vous dit : 'Tu ne me fais jamais confiance.' Quelle réponse est la plus CNV ?",
    options: [
      "Quand tu dis ça, qu'est-ce qui t'a fait sentir ce manque de confiance récemment ?",
      "C'est faux, je te fais entièrement confiance.",
      "Si tu étais plus fiable, je te ferais confiance.",
      "Tu exagères, comme d'habitude.",
    ],
    explanation:
      "La CNV invite à l'empathie active : reformuler pour comprendre les faits et les besoins de l'autre, plutôt que se défendre, contre-attaquer ou minimiser.",
    theme: "Écoute empathique",
  },
  {
    id: "cnv-06",
    question:
      "Parmi ces formulations, laquelle évite le JUGEMENT moralisateur ?",
    options: [
      "Tu as livré le dossier 3 jours après la deadline annoncée.",
      "Tu es irresponsable.",
      "Tu ne respectes rien ni personne.",
      "Tu es la pire recrue qu'on ait eue.",
    ],
    explanation:
      "Le jugement moralisateur étiquette la personne ('irresponsable', 'pire'). La CNV s'en tient aux faits observables et mesurables.",
    theme: "Observation",
  },
  {
    id: "cnv-07",
    question:
      "Lequel de ces 'sentiments' est en réalité une PENSÉE déguisée selon la CNV ?",
    options: [
      "Je me sens manipulé.",
      "Je me sens triste.",
      "Je me sens fatigué.",
      "Je me sens soulagé.",
    ],
    explanation:
      "'Manipulé' implique une action de l'autre — c'est une interprétation, pas un sentiment. Triste, fatigué, soulagé sont des états intérieurs purs.",
    theme: "Sentiment",
  },
  {
    id: "cnv-08",
    question: "Quel est l'objectif principal de la CNV en contexte managérial ?",
    options: [
      "Créer les conditions d'un dialogue où chacun se sent entendu et libre de coopérer.",
      "Obtenir que l'autre fasse ce qu'on attend de lui.",
      "Éviter tout conflit dans l'équipe.",
      "Adopter un ton toujours doux et conciliant.",
    ],
    explanation:
      "La CNV vise la qualité du lien et la coopération, pas l'obtention d'un comportement. Elle ne fuit pas le conflit, elle le traite autrement.",
    theme: "Fondamentaux",
  },
  {
    id: "cnv-09",
    question:
      "Vous voulez donner un feedback correctif. Quelle ouverture est la plus CNV ?",
    options: [
      "Lors de la réunion de mardi, j'ai remarqué que tu as coupé la parole à trois reprises. J'aimerais te partager ce que ça a provoqué chez moi.",
      "Il faut qu'on parle de ton comportement en réunion.",
      "Tu as encore été insupportable hier.",
      "Tu sais ce que tu as fait, non ?",
    ],
    explanation:
      "La bonne ouverture combine observation factuelle ('mardi, trois fois') et invitation au dialogue. Les autres versions accusent, étiquettent ou culpabilisent.",
    theme: "Feedback",
  },
  {
    id: "cnv-10",
    question:
      "Lorsqu'un collaborateur réagit fortement à un feedback, la CNV recommande de :",
    options: [
      "Accueillir sa réaction, reformuler ce que tu entends de ses sentiments et besoins.",
      "Maintenir fermement ta position pour ne pas perdre en autorité.",
      "Reporter la conversation à plus tard, quand il sera plus calme.",
      "Reformuler ton feedback avec plus de force pour qu'il comprenne.",
    ],
    explanation:
      "Une réaction forte signale un besoin touché. L'écoute empathique permet de désamorcer sans renoncer à son propre message.",
    theme: "Écoute empathique",
  },
  {
    id: "cnv-11",
    question:
      "Quelle phrase exprime correctement une OBSERVATION suivie d'un SENTIMENT ?",
    options: [
      "Quand je vois trois dossiers en retard cette semaine, je me sens préoccupé.",
      "Tu es désinvolte, ça m'agace profondément.",
      "Je sens que tu te fiches de ton travail.",
      "C'est insupportable de bosser avec quelqu'un comme toi.",
    ],
    explanation:
      "La structure CNV enchaîne fait observable et émotion personnelle, sans étiquette, sans interprétation, sans attaque personnelle.",
    theme: "OSBD",
  },
  {
    id: "cnv-12",
    question:
      "Selon la CNV, un BESOIN se distingue d'une STRATÉGIE par le fait que :",
    options: [
      "Le besoin est universel (sécurité, reconnaissance, autonomie...), la stratégie est une façon parmi d'autres de le satisfaire.",
      "Le besoin est urgent, la stratégie est facultative.",
      "Le besoin se dit, la stratégie se cache.",
      "Le besoin est négociable, la stratégie ne l'est pas.",
    ],
    explanation:
      "Confondre besoin et stratégie est l'erreur la plus fréquente. 'Avoir une réunion lundi' est une stratégie ; 'avoir de la clarté sur le projet' est le besoin sous-jacent.",
    theme: "Besoin",
  },
  {
    id: "cnv-13",
    question:
      "Vous voulez refuser une demande sans agresser ni vous soumettre. Que fait la CNV ?",
    options: [
      "Vous dites non au comportement demandé tout en accueillant le besoin derrière la demande.",
      "Vous dites non sec et passez à autre chose.",
      "Vous acceptez à contrecœur pour préserver la relation.",
      "Vous expliquez en détail pourquoi la demande est mal formulée.",
    ],
    explanation:
      "La CNV permet un 'non' clair sans rupture relationnelle : on refuse la stratégie proposée tout en reconnaissant la légitimité du besoin de l'autre.",
    theme: "Demande",
  },
  {
    id: "cnv-14",
    question: "Qu'est-ce qui distingue une EXIGENCE d'une DEMANDE en CNV ?",
    options: [
      "Dans une demande, un 'non' de l'autre reste acceptable ; dans une exigence, non.",
      "Une demande est polie, une exigence est sèche.",
      "Une demande est verbale, une exigence est écrite.",
      "Une demande s'adresse aux pairs, une exigence aux subordonnés.",
    ],
    explanation:
      "Le test est simple : si tu réagis mal à un refus, c'était une exigence, pas une demande. Cela invite à clarifier les enjeux plutôt qu'à imposer.",
    theme: "Demande",
  },
  {
    id: "cnv-15",
    question:
      "Quel est le piège le plus fréquent pour un manager qui débute en CNV ?",
    options: [
      "Utiliser le vocabulaire CNV pour camoufler des reproches ('je me sens trahi par toi').",
      "Parler trop doucement.",
      "Faire des phrases trop longues.",
      "Ne pas connaître la liste exhaustive des besoins humains.",
    ],
    explanation:
      "Le 'CNV cosmétique' est l'écueil classique : en habillant un reproche de formulations 'je-suis', on neutralise l'effet bénéfique de la méthode. La CNV est une posture, pas un vocabulaire.",
    theme: "Fondamentaux",
  },
];
