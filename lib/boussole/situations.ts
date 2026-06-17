import type { ProfilId } from './profiles';

export type Situation = {
  id: string;
  context: string;
  choices: { value: ProfilId; label: string }[];
};

export const SITUATIONS: Situation[] = [
  // Contexte A — Réunion & décision
  {
    id: 'A1',
    context: "Votre équipe discute depuis 40 minutes sans décision. Le temps file.",
    choices: [
      { value: 'pilote', label: "Vous prenez la parole et proposez un vote immédiat pour trancher." },
      { value: 'dynamo', label: "Vous relancez l'énergie avec une idée nouvelle pour débloquer le groupe." },
      { value: 'socle', label: "Vous vérifiez que tout le monde a pu s'exprimer avant de conclure." },
      { value: 'repere', label: "Vous demandez qu'on liste les critères de décision avant de choisir." },
    ],
  },
  {
    id: 'A2',
    context: "On vous demande votre avis sur une décision déjà prise par votre manager.",
    choices: [
      { value: 'pilote', label: "Vous dites clairement si vous n'êtes pas d'accord, avec vos arguments." },
      { value: 'dynamo', label: "Vous cherchez ce qui est positif dans la décision et le mettez en avant." },
      { value: 'socle', label: "Vous soutenez la décision pour maintenir la cohésion de l'équipe." },
      { value: 'repere', label: "Vous demandez à voir les données qui ont motivé ce choix." },
    ],
  },
  {
    id: 'A3',
    context: "Deux collègues défendent des approches opposées. La tension monte.",
    choices: [
      { value: 'pilote', label: "Vous intervenez pour imposer une direction et sortir de l'impasse." },
      { value: 'dynamo', label: "Vous allégez l'atmosphère avec de l'humour et recentrez sur l'objectif commun." },
      { value: 'socle', label: "Vous proposez une pause et prenez le temps d'écouter chacun séparément." },
      { value: 'repere', label: "Vous suggérez de formaliser les deux options par écrit pour les comparer objectivement." },
    ],
  },
  {
    id: 'A4',
    context: "Votre équipe doit choisir entre deux outils. Vous avez 30 minutes.",
    choices: [
      { value: 'pilote', label: "Vous choisissez celui que vous maîtrisez déjà et passez à autre chose." },
      { value: 'dynamo', label: "Vous proposez de tester les deux rapidement et de voter." },
      { value: 'socle', label: "Vous consultez chacun pour savoir lequel serait le plus confortable pour tous." },
      { value: 'repere', label: "Vous listez les critères techniques avant toute décision." },
    ],
  },
  {
    id: 'A5',
    context: "Une réunion importante a lieu demain. Comment vous préparez-vous ?",
    choices: [
      { value: 'pilote', label: "Vous identifiez les 3 décisions à faire prendre et préparez vos arguments." },
      { value: 'dynamo', label: "Vous pensez à comment rendre la réunion dynamique et engageante." },
      { value: 'socle', label: "Vous vérifiez que tout le monde est aligné et à l'aise avant d'entrer." },
      { value: 'repere', label: "Vous préparez un support structuré avec tous les éléments factuels." },
    ],
  },
  {
    id: 'A6',
    context: "La réunion déborde et il reste un point important non abordé.",
    choices: [
      { value: 'pilote', label: "Vous interrompez poliment et forcez le passage au point essentiel." },
      { value: 'dynamo', label: "Vous proposez de traiter ça en 5 minutes chrono maintenant." },
      { value: 'socle', label: "Vous suggérez de reporter pour ne pas brusquer le groupe." },
      { value: 'repere', label: "Vous proposez de traiter le point par écrit après la réunion pour plus de clarté." },
    ],
  },

  // Contexte B — Projet & organisation
  {
    id: 'B1',
    context: "Votre projet accuse du retard. Que faites-vous en premier ?",
    choices: [
      { value: 'pilote', label: "Vous réorganisez les priorités et coupez ce qui n'est pas essentiel." },
      { value: 'dynamo', label: "Vous motivez l'équipe et cherchez comment accélérer ensemble." },
      { value: 'socle', label: "Vous prenez le temps de comprendre pourquoi le retard s'est installé." },
      { value: 'repere', label: "Vous faites un diagnostic complet avant de modifier quoi que ce soit." },
    ],
  },
  {
    id: 'B2',
    context: "On vous confie un nouveau projet sans brief détaillé.",
    choices: [
      { value: 'pilote', label: "Vous démarrez immédiatement avec ce que vous avez et ajustez en route." },
      { value: 'dynamo', label: "Vous organisez un atelier pour co-construire la vision avec l'équipe." },
      { value: 'socle', label: "Vous attendez d'avoir les confirmations nécessaires pour ne pas faire fausse route." },
      { value: 'repere', label: "Vous rédigez vous-même un brief de cadrage à valider avant de commencer." },
    ],
  },
  {
    id: 'B3',
    context: "Vous devez livrer un livrable dans 2 jours, mais il manque des informations.",
    choices: [
      { value: 'pilote', label: "Vous livrez avec les hypothèses les plus raisonnables et signalez les manques." },
      { value: 'dynamo', label: "Vous relancez immédiatement tout le monde en parallèle pour débloquer." },
      { value: 'socle', label: "Vous attendez les retours plutôt que de risquer un livrable incomplet." },
      { value: 'repere', label: "Vous documentez précisément ce qui manque et escaladez formellement." },
    ],
  },
  {
    id: 'B4',
    context: "Votre façon de travailler préférée sur un projet long :",
    choices: [
      { value: 'pilote', label: "Des objectifs clairs, de l'autonomie, et un point résultat en fin de sprint." },
      { value: 'dynamo', label: "Des échanges fréquents, beaucoup d'itérations et une atmosphère de collaboration." },
      { value: 'socle', label: "Un rythme stable, des rôles définis, peu de surprises." },
      { value: 'repere', label: "Un cadrage rigoureux au départ, des jalons documentés, des livrables bien définis." },
    ],
  },
  {
    id: 'B5',
    context: "Vous découvrez en cours de projet que la direction a changé.",
    choices: [
      { value: 'pilote', label: "Vous pivotez immédiatement et adaptez le plan sans vous attarder sur l'ancien." },
      { value: 'dynamo', label: "Vous cherchez l'opportunité dans le changement et le vendez positivement à l'équipe." },
      { value: 'socle', label: "Vous vérifiez l'impact humain sur l'équipe avant de toucher à l'organisation." },
      { value: 'repere', label: "Vous réévaluez l'ensemble du plan avant de communiquer quoi que ce soit." },
    ],
  },
  {
    id: 'B6',
    context: "Un collègue vous demande de reprendre une partie de son travail en urgence.",
    choices: [
      { value: 'pilote', label: "Vous évaluez si c'est prioritaire et décidez en 2 minutes." },
      { value: 'dynamo', label: "Vous acceptez volontiers — aider les autres vous motive." },
      { value: 'socle', label: "Vous acceptez pour ne pas le laisser en difficulté, même si ça vous surcharge." },
      { value: 'repere', label: "Vous demandez un brief précis avant de vous engager." },
    ],
  },

  // Contexte C — Relation & feedback
  {
    id: 'C1',
    context: "Un collègue fait une erreur qui impacte votre travail.",
    choices: [
      { value: 'pilote', label: "Vous lui dites directement et clairement ce qui s'est passé." },
      { value: 'dynamo', label: "Vous trouvez une façon légère d'aborder le sujet pour ne pas créer de tension." },
      { value: 'socle', label: "Vous absorbez l'impact et gérez sans en faire un sujet." },
      { value: 'repere', label: "Vous documentez l'erreur et proposez un process pour l'éviter à l'avenir." },
    ],
  },
  {
    id: 'C2',
    context: "On vous demande de donner un feedback difficile à un pair.",
    choices: [
      { value: 'pilote', label: "Vous allez droit au but, avec bienveillance mais sans détour." },
      { value: 'dynamo', label: "Vous commencez par plusieurs points positifs avant d'aborder le sujet." },
      { value: 'socle', label: "Vous choisissez le bon moment et le bon cadre pour que ça se passe bien." },
      { value: 'repere', label: "Vous préparez des exemples précis et factuels pour étayer votre retour." },
    ],
  },
  {
    id: 'C3',
    context: "Vous recevez un feedback que vous trouvez injuste.",
    choices: [
      { value: 'pilote', label: "Vous le dites immédiatement et demandez des clarifications." },
      { value: 'dynamo', label: "Vous cherchez ce qu'il y a de constructif dedans avant de réagir." },
      { value: 'socle', label: "Vous encaissez et en parlez plus tard, quand les esprits sont apaisés." },
      { value: 'repere', label: "Vous demandez des exemples concrets pour évaluer objectivement le retour." },
    ],
  },
  {
    id: 'C4',
    context: "Un nouveau collègue intègre l'équipe. Quel est votre premier réflexe ?",
    choices: [
      { value: 'pilote', label: "Vous lui expliquez rapidement comment les choses fonctionnent ici." },
      { value: 'dynamo', label: "Vous l'embarquez dans une discussion pour créer du lien." },
      { value: 'socle', label: "Vous vous assurez qu'il se sent à l'aise et pas perdu." },
      { value: 'repere', label: "Vous lui partagez les ressources et docs clés pour qu'il comprenne le contexte." },
    ],
  },
  {
    id: 'C5',
    context: "Votre manager vous demande votre avis sur une initiative que vous trouvez floue.",
    choices: [
      { value: 'pilote', label: "Vous exprimez vos doutes directement et proposez une alternative." },
      { value: 'dynamo', label: "Vous posez des questions ouvertes pour mieux comprendre la vision." },
      { value: 'socle', label: "Vous soutenez l'initiative par respect pour la décision managériale." },
      { value: 'repere', label: "Vous demandez un document de cadrage avant de vous prononcer." },
    ],
  },
  {
    id: 'C6',
    context: "L'équipe célèbre une victoire. Quelle est votre façon naturelle de contribuer ?",
    choices: [
      { value: 'pilote', label: "Vous proposez d'enchaîner sur le prochain objectif pendant que l'élan est là." },
      { value: 'dynamo', label: "Vous organisez quelque chose pour marquer le coup et renforcer le groupe." },
      { value: 'socle', label: "Vous prenez le temps de remercier chacun pour sa contribution." },
      { value: 'repere', label: "Vous faites un bilan de ce qui a fonctionné pour capitaliser dessus." },
    ],
  },

  // Contexte D — Style personnel
  {
    id: 'D1',
    context: "Vous avez une heure libre inattendue. Que faites-vous ?",
    choices: [
      { value: 'pilote', label: "Vous avancez sur un dossier qui traîne depuis trop longtemps." },
      { value: 'dynamo', label: "Vous en profitez pour aller échanger avec des collègues." },
      { value: 'socle', label: "Vous rattrapez du retard administratif pour être à jour." },
      { value: 'repere', label: "Vous structurez et documentez quelque chose qui méritait plus de rigueur." },
    ],
  },
  {
    id: 'D2',
    context: "Votre environnement de travail idéal :",
    choices: [
      { value: 'pilote', label: "Un espace dégagé, peu de distractions, accès direct aux décideurs." },
      { value: 'dynamo', label: "Un open-space vivant, des échanges fréquents, une énergie collective." },
      { value: 'socle', label: "Un endroit stable, une équipe connue, peu de changements imprévus." },
      { value: 'repere', label: "Un poste bien organisé, des outils fiables, un calme propice à la concentration." },
    ],
  },
  {
    id: 'D3',
    context: "Vous devez apprendre rapidement un nouvel outil.",
    choices: [
      { value: 'pilote', label: "Vous l'ouvrez et explorez par vous-même jusqu'à comprendre l'essentiel." },
      { value: 'dynamo', label: "Vous cherchez un collègue qui s'y connaît pour apprendre en échangeant." },
      { value: 'socle', label: "Vous suivez le tutoriel officiel étape par étape." },
      { value: 'repere', label: "Vous lisez d'abord la documentation complète avant de toucher à l'outil." },
    ],
  },
  {
    id: 'D4',
    context: "Comment vous savez que vous avez bien fait votre travail ?",
    choices: [
      { value: 'pilote', label: "Quand les résultats sont là et l'objectif atteint." },
      { value: 'dynamo', label: "Quand les gens autour de vous sont enthousiastes et motivés." },
      { value: 'socle', label: "Quand tout le monde est satisfait et l'équipe fonctionne bien." },
      { value: 'repere', label: "Quand le livrable est précis, complet, et sans erreur." },
    ],
  },
  {
    id: 'D5',
    context: "Une tâche répétitive mais nécessaire s'accumule dans votre to-do.",
    choices: [
      { value: 'pilote', label: "Vous la bloquez dans l'agenda et l'expédiez en un bloc." },
      { value: 'dynamo', label: "Vous cherchez à la rendre plus fun ou à la faire en duo." },
      { value: 'socle', label: "Vous l'intégrez à votre routine pour ne pas vous en préoccuper." },
      { value: 'repere', label: "Vous créez un process ou un template pour la traiter proprement une fois pour toutes." },
    ],
  },
  {
    id: 'D6',
    context: "Vous avez deux missions urgentes en même temps. Que faites-vous ?",
    choices: [
      { value: 'pilote', label: "Vous tranchez immédiatement sur la priorité et gérez l'une après l'autre." },
      { value: 'dynamo', label: "Vous demandez de l'aide pour gérer les deux en parallèle." },
      { value: 'socle', label: "Vous vérifiez d'abord l'impact sur l'équipe avant de décider." },
      { value: 'repere', label: "Vous évaluez les deux missions en détail pour décider laquelle mérite votre attention en premier." },
    ],
  },
];

export function pickSituations(count: number): string[] {
  const ids = SITUATIONS.map((s) => s.id);
  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
