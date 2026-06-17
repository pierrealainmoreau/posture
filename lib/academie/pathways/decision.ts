import type { AcademiePathway } from "@/lib/types";

export const DECISION_PATHWAY: AcademiePathway = {
  id: "decision",
  title: "Prise de décision",
  short_description: "Décider sous incertitude, sans biais ni paralysie",
  long_description:
    "Décider fait partie du rôle de manager — mais bien décider s'apprend. Identifier ses biais cognitifs, savoir quand impliquer et quand trancher, assumer ses décisions dans la durée : des compétences souvent laissées au hasard.",
  icon_name: "GitBranch",
  color_theme: "violet",
  estimated_minutes: 15,
  is_available: true,
  final_badge: {
    name: "Décideur lucide",
    description:
      "Vous décidez avec méthode, clarté et responsabilité, même sous incertitude.",
  },
  quizzes: [
    {
      id: "decision-1-biais",
      title: "Connaître ses biais",
      description: "Les pièges cognitifs qui faussent les décisions",
      tier: "bronze",
      passing_score_percent: 80,
      questions: [
        {
          id: "decision-1-q1",
          question:
            "Vous avez déjà investi 6 mois sur un projet qui donne peu de résultats. Continuer serait-il rationnel ?",
          options: [
            "Non : la décision de continuer doit se baser sur les perspectives futures, pas sur ce qui est déjà dépensé.",
            "Oui, parce qu'abandonner signifie perdre tout ce qui a déjà été investi.",
            "Cela dépend du montant déjà investi.",
            "Oui, l'équipe a besoin de voir ses efforts reconnus.",
          ],
          explanation:
            "C'est le biais du coût irrécupérable (sunk cost fallacy) : continuer un projet parce qu'on y a déjà investi du temps ou de l'argent est irrationnel. Ce qui a été dépensé est perdu dans tous les cas. La décision doit uniquement peser les bénéfices et coûts futurs.",
        },
        {
          id: "decision-1-q2",
          question:
            "Quel biais cognitif pousse à chercher des informations qui confirment ce qu'on pense déjà ?",
          options: [
            "Le biais de confirmation.",
            "Le biais de disponibilité.",
            "L'effet de halo.",
            "Le biais d'ancrage.",
          ],
          explanation:
            "Le biais de confirmation nous pousse à privilégier les informations qui valident nos croyances existantes et à ignorer celles qui les contredisent. En management, il peut conduire à des recrutements, des évaluations ou des décisions stratégiques très biaisées. Le remède : chercher activement les arguments contraires.",
        },
        {
          id: "decision-1-q3",
          question:
            "Vous recevez la candidature de Marc, dont le début de CV est exceptionnel. Vous l'évaluez globalement très positivement, même sur des compétences que vous n'avez pas encore testées. Quel biais est à l'œuvre ?",
          options: [
            "L'effet de halo.",
            "Le biais de confirmation.",
            "Le biais d'ancrage.",
            "Le biais de disponibilité.",
          ],
          explanation:
            "L'effet de halo : une caractéristique fortement positive (ou négative) colore l'évaluation de toutes les autres. Un excellent début de CV crée une aura positive qui influence l'ensemble du jugement, même sur des compétences non évaluées. Les entretiens structurés avec critères prédéfinis sont le meilleur antidote.",
        },
        {
          id: "decision-1-q4",
          question:
            "Votre première estimation pour un projet était de 3 mois. Malgré de nouveaux éléments, vous maintenez cette estimation comme base. Quel biais illustre cette situation ?",
          options: [
            "Le biais d'ancrage.",
            "Le biais d'optimisme.",
            "Le biais de confirmation.",
            "L'effet de halo.",
          ],
          explanation:
            "Le biais d'ancrage : le premier chiffre entendu (ou produit) sert de point de référence même quand de nouvelles informations devraient le remettre en question. En estimation de projets ou en négociation, l'ancre initiale a un poids disproportionné sur les décisions suivantes.",
        },
        {
          id: "decision-1-q5",
          question:
            "Comment réduire concrètement l'impact de ses biais cognitifs dans une décision importante ?",
          options: [
            "Consulter des personnes qui ont une perspective différente et chercher activement des arguments contraires.",
            "Prendre plus de temps pour réfléchir.",
            "Se fier à son expérience passée.",
            "Déléguer la décision à quelqu'un d'autre.",
          ],
          explanation:
            "La diversité des perspectives est le meilleur débiaiseur. Chercher activement quelqu'un qui pense différemment, formuler l'argument contraire soi-même ('steel-manning'), ou imaginer que la décision inverse a été prise et en lister les avantages : ces techniques forcent à sortir de sa bulle cognitive.",
        },
      ],
    },
    {
      id: "decision-2-processus",
      title: "Structurer une décision",
      description: "Quand trancher seul, quand impliquer",
      tier: "silver",
      passing_score_percent: 80,
      questions: [
        {
          id: "decision-2-q1",
          question:
            "Quelle est la principale erreur dans le processus décisionnel de la plupart des managers ?",
          options: [
            "Confondre la phase de génération d'options avec la phase d'évaluation.",
            "Décider trop vite sans assez d'informations.",
            "Trop impliquer l'équipe dans les décisions.",
            "Ne pas suffisamment se fier à leur intuition.",
          ],
          explanation:
            "Fusionner 'générer des options' et 'évaluer des options' est un piège classique : on critique les idées avant qu'elles soient complètes, on se fixe prématurément sur une option, et on rate des alternatives créatives. Brainstorming d'abord (jugement suspendu), évaluation ensuite : ce séquençage change la qualité des décisions.",
        },
        {
          id: "decision-2-q2",
          question:
            "Selon le modèle RACI, quelle est la différence entre 'Responsable' et 'Accountable' ?",
          options: [
            "Responsable exécute la tâche, Accountable rend des comptes sur le résultat final.",
            "Ce sont des synonymes.",
            "Responsable est le manager, Accountable est le collaborateur.",
            "Accountable signifie que la personne peut bloquer une décision.",
          ],
          explanation:
            "La distinction R/A est fondamentale dans la prise de décision collective. Plusieurs personnes peuvent être 'Responsable' (exécutants), mais il ne doit y avoir qu'un seul 'Accountable' (redevable du résultat final). Confondre les deux crée soit de la dilution soit de la paralysie.",
        },
        {
          id: "decision-2-q3",
          question:
            "Vous devez décider rapidement d'un prestataire pour un projet urgent. Vous manquez d'informations. Quelle est la bonne posture ?",
          options: [
            "Décider avec les informations disponibles en nommant explicitement les incertitudes résiduelles.",
            "Attendre d'avoir toutes les informations nécessaires.",
            "Demander à l'équipe de voter.",
            "Remonter la décision à votre propre manager.",
          ],
          explanation:
            "Attendre la certitude totale est une forme de paralysie décisionnelle. Décider avec les informations disponibles, en nommant explicitement ce qui reste incertain et en prévoyant des points de réévaluation, est la posture du bon décideur sous contrainte. Nommer l'incertitude n'est pas une faiblesse — c'est de la rigueur.",
        },
        {
          id: "decision-2-q4",
          question:
            "Vous consultez votre équipe avant de prendre une décision importante. Quelle précision est indispensable ?",
          options: [
            "Leur préciser que vous consultez mais que la décision finale reste la vôtre.",
            "Leur dire que la décision finale leur appartient.",
            "Leur promettre de suivre la majorité.",
            "Ne pas les consulter si vous savez déjà ce que vous allez décider.",
          ],
          explanation:
            "Consulter sans clarifier le mode de décision est une source de désillusion. Si les gens pensent que leur avis sera suivi et que vous tranchez différemment, la confiance s'effrite. Clarifier d'emblée : 'je consulte pour enrichir ma réflexion, la décision finale est la mienne' évite la frustration post-consultation.",
        },
        {
          id: "decision-2-q5",
          question:
            "Quelle technique aide à surmonter la paralysie décisionnelle face à une décision complexe et réversible ?",
          options: [
            "Se demander : 'quelle est la pire chose qui peut arriver si je me trompe, et est-ce récupérable ?'",
            "Reporter la décision de 48 heures pour laisser décanter.",
            "Prendre la décision la plus prudente pour minimiser les risques.",
            "Chercher un consensus total dans l'équipe.",
          ],
          explanation:
            "La question 'est-ce que c'est récupérable si je me trompe ?' est libératrice pour les décisions réversibles. La plupart des décisions managériales le sont. Se rappeler que décider et ajuster est presque toujours mieux que ne pas décider libère de la paralysie induite par la peur de l'erreur.",
        },
      ],
    },
    {
      id: "decision-3-assumer",
      title: "Assumer et communiquer ses décisions",
      description: "Expliquer, défendre, ajuster",
      tier: "gold",
      passing_score_percent: 80,
      questions: [
        {
          id: "decision-3-q1",
          question:
            "Vous avez pris une décision que votre équipe conteste. Comment la défendez-vous ?",
          options: [
            "En expliquant les critères qui ont guidé votre choix et en reconnaissant les inconvénients de la décision.",
            "En rappelant que c'est votre rôle de décider et qu'ils doivent faire confiance.",
            "En cherchant à convaincre que votre choix est le meilleur possible.",
            "En organisant un vote pour leur donner l'illusion de participation.",
          ],
          explanation:
            "Expliquer les critères (pas juste défendre le choix) est ce qui crée l'adhésion ou au moins le respect. Reconnaître les inconvénients ('je sais que cette décision a des impacts contraignants pour certains d'entre vous') montre que vous avez pesé les options sérieusement. Une conviction trop affirmée, au contraire, ferme le dialogue.",
        },
        {
          id: "decision-3-q2",
          question:
            "Vous réalisez que la décision que vous avez prise il y a un mois est mauvaise. Quelle est la bonne posture ?",
          options: [
            "Reconnaître l'erreur, expliquer ce que vous avez appris, et annoncer l'ajustement.",
            "Maintenir la décision pour ne pas perdre en crédibilité.",
            "Attribuer l'erreur à des facteurs externes pour protéger votre image.",
            "Prendre une nouvelle décision sans faire référence à la précédente.",
          ],
          explanation:
            "Reconnaître une erreur décisionnelle augmente la crédibilité à long terme, elle ne la détruit pas. Les managers qui ne reconnaissent jamais leurs erreurs sont perçus comme rigides ou peu fiables. Nommer l'erreur, expliquer ce qui a changé dans la compréhension du problème, et annoncer l'ajustement : c'est la posture du leader apprenante.",
        },
        {
          id: "decision-3-q3",
          question:
            "Quelle est la différence entre une décision 'consensuelle' et une décision 'consentie' ?",
          options: [
            "Le consensus exige que tout le monde soit d'accord ; le consentement exige que personne n'ait d'objection bloquante.",
            "Elles signifient la même chose.",
            "Le consensus est plus rapide à obtenir.",
            "La décision consentie ne peut être prise que par le manager.",
          ],
          explanation:
            "Le consensus (tout le monde approuve) est rare et souvent artificiel. Le consentement (personne n'a d'objection raisonnée) est plus atteignable et plus honnête. En gouvernance partagée, cette distinction change radicalement la dynamique : on n'attend pas l'enthousiasme de tous, mais l'absence d'objection fondée.",
        },
        {
          id: "decision-3-q4",
          question:
            "Comment communiquer efficacement une décision difficile que votre équipe n'appréciera pas ?",
          options: [
            "L'annoncer en réunion : la décision, son contexte, ses raisons, ses impacts, et un espace pour les questions.",
            "L'annoncer brièvement dans un email pour que les gens aient le temps d'y réfléchir.",
            "L'annoncer progressivement pour laisser le temps de l'acceptation.",
            "Attendre que quelqu'un pose la question pour ne pas provoquer la réaction.",
          ],
          explanation:
            "Une décision impopulaire gagne à être annoncée en direct, avec contexte et espace de réaction. Email = message froid, interprétable dans tous les sens, sans espace d'expression. Progressif = rumeur et méfiance. Attendre = signal que vous évitez le sujet. Le direct, avec la structure contexte-raisons-impact-questions, est le format le plus respectable.",
        },
        {
          id: "decision-3-q5",
          question:
            "Votre décision est prise mais un collaborateur continue à la remettre en question au quotidien. Comment gérez-vous cela ?",
          options: [
            "Vous reconnaissez son désaccord, réaffirmez la décision, et clarifiez qu'elle n'est plus à débattre mais que son implémentation est ouverte à ses contributions.",
            "Vous ignorez : il finira par accepter.",
            "Vous lui donnez une dernière chance d'exprimer son désaccord en réunion.",
            "Vous revenez sur la décision pour maintenir la cohésion d'équipe.",
          ],
          explanation:
            "La distinction entre 'décision en débat' et 'implémentation en construction' est fondamentale. Une fois la décision actée, la rouvrir en permanence affaiblit l'autorité managériale et épuise le collectif. Reconnaître le désaccord (sans y céder), fermer le débat sur la décision, et ouvrir le champ sur 'comment on la met en œuvre le mieux possible' est la bonne posture.",
        },
      ],
    },
    {
      id: "decision-final",
      title: "Examen final — Prise de décision",
      description: "Mise en situation de bout en bout",
      tier: "final",
      passing_score_percent: 80,
      questions: [
        {
          id: "decision-final-q1",
          question:
            "Vous devez choisir entre deux options pour réorganiser votre équipe. Les deux semblent équivalentes. Comment progressez-vous ?",
          options: [
            "Vous définissez des critères de décision explicites avant d'évaluer les options.",
            "Vous choisissez l'option la plus facile à mettre en œuvre.",
            "Vous consultez votre équipe pour qu'elle choisisse.",
            "Vous choisissez l'option que votre propre manager préférerait.",
          ],
          explanation:
            "Définir des critères avant d'évaluer les options est l'une des pratiques décisionnelles les plus efficaces. Elle évite que le choix soit dicté par la facilité, les biais ou la pression sociale. Critères possibles : impact sur les gens, facilité d'implémentation, alignement stratégique, réversibilité.",
        },
        {
          id: "decision-final-q2",
          question:
            "Quel est le principal risque d'impliquer trop de personnes dans une décision ?",
          options: [
            "Toutes ces réponses sont des risques réels.",
            "Les décisions prennent plus de temps.",
            "Le phénomène de 'pensée de groupe' peut supprimer les voix dissidentes.",
            "Les personnes impliquées attendent d'être systématiquement consultées à l'avenir.",
          ],
          explanation:
            "Les trois risques coexistent. La pensée de groupe (groupthink) pousse le collectif vers le consensus au détriment de la rigueur. La consultation crée des précédents d'implication. Et la lenteur est réelle. L'enjeu est de calibrer le niveau d'implication en fonction du type de décision, pas d'appliquer toujours la même règle.",
        },
        {
          id: "decision-final-q3",
          question:
            "Quelle méthode aide à évaluer une décision sous incertitude quand les informations sont parcellaires ?",
          options: [
            "Faire une analyse de scénarios : que se passe-t-il dans le meilleur, le pire et le cas médian ?",
            "Attendre d'avoir 100% des informations.",
            "Se fier à l'intuition des personnes les plus expérimentées.",
            "Prendre la décision statistiquement la plus probable.",
          ],
          explanation:
            "L'analyse de scénarios (meilleur cas / pire cas / cas probable) force à penser les extrêmes et à évaluer sa tolérance au risque. Elle évite l'optimisme naïf tout en ne paralysant pas par la peur du pire. C'est un outil simple, rapide, et très efficace sous incertitude.",
        },
        {
          id: "decision-final-q4",
          question:
            "Quelle posture caractérise un manager qui décide bien ?",
          options: [
            "Il calibre la méthode de décision au contexte, assume ses choix, et sait les ajuster.",
            "Il décide vite et n'hésite jamais.",
            "Il consulte toujours son équipe avant de décider.",
            "Il documente chaque décision pour pouvoir se justifier.",
          ],
          explanation:
            "Bien décider, ce n'est pas toujours décider vite, ni toujours consulter, ni tout documenter. C'est calibrer : urgence et réversibilité de la décision, besoin d'implication de l'équipe, enjeux de risque. Puis assumer le choix fait, et être prêt à l'ajuster si les faits changent.",
        },
        {
          id: "decision-final-q5",
          question:
            "Vous prenez une décision et vous vous rendez compte après coup qu'elle était biaisée par une information saillante (un incident récent a trop pesé). Quel biais était à l'œuvre ?",
          options: [
            "Le biais de disponibilité.",
            "Le biais d'ancrage.",
            "L'effet de halo.",
            "Le biais de confirmation.",
          ],
          explanation:
            "Le biais de disponibilité : les informations récentes, émotionnellement fortes ou facilement mémorisables pèsent trop lourd dans notre jugement, au détriment des données statistiques plus solides. Un incident spectaculaire récent déforme notre évaluation du risque. Se demander 'est-ce que j'accorde trop de poids à ce qui est récent ?' est un bon réflexe.",
        },
        {
          id: "decision-final-q6",
          question:
            "Vous êtes en désaccord avec une décision de votre propre hiérarchie que vous devez transmettre à votre équipe. Comment gérez-vous cela ?",
          options: [
            "Vous transmettez la décision avec le contexte et les raisons, sans la saboter, et exprimez votre désaccord en interne par les canaux appropriés.",
            "Vous transmettez la décision en expliquant que vous n'étiez pas d'accord, pour rester honnête.",
            "Vous attendez de voir si la décision sera vraiment appliquée avant de la communiquer.",
            "Vous demandez à votre propre manager de l'annoncer lui-même.",
          ],
          explanation:
            "Le principe 'disagree and commit' : vous pouvez ne pas être d'accord avec une décision, l'avoir dit en interne, et la porter loyalement auprès de votre équipe. Signaler publiquement votre désaccord crée une dissonance qui démotive et décrédibilise la décision. Les canaux internes sont le lieu du désaccord, pas le message à l'équipe.",
        },
        {
          id: "decision-final-q7",
          question:
            "Qu'est-ce que le 'pre-mortem' dans le cadre d'une décision ?",
          options: [
            "Une technique qui consiste à imaginer que la décision a échoué et à remonter les causes possibles.",
            "Une analyse des décisions passées qui ont mal tourné.",
            "Une consultation des parties prenantes avant de décider.",
            "Un document de validation signé par la hiérarchie.",
          ],
          explanation:
            "Le pre-mortem (Gary Klein) : avant d'implémenter une décision, imaginez qu'on est 6 mois plus tard et que tout a mal tourné. Quelles en sont les causes probables ? Cette technique force à identifier les risques que l'optimisme collectif masque, et permet de les adresser avant de démarrer.",
        },
        {
          id: "decision-final-q8",
          question:
            "Votre équipe attend une décision depuis plusieurs semaines. Vous manquez encore d'informations. Que faites-vous ?",
          options: [
            "Vous communiquez sur l'état de la décision : ce que vous savez, ce qui manque encore, et quand vous déciderez.",
            "Vous attendez d'avoir toutes les informations nécessaires.",
            "Vous prenez une décision provisoire pour débloquer la situation.",
            "Vous déléguez la décision à l'équipe pour gagner du temps.",
          ],
          explanation:
            "L'incertitude sur une décision est plus tolérée quand elle est nommée et cadrée dans le temps. Communiquer 'voici où on en est, voici ce qui manque encore, voici quand je décide' réduit l'anxiété de l'équipe et maintient la confiance. Le silence est toujours interprété comme du flottement ou de l'évitement.",
        },
      ],
    },
  ],
};
