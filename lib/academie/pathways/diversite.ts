import type { AcademiePathway } from "@/lib/types";

export const DIVERSITE_PATHWAY: AcademiePathway = {
  id: "diversite",
  title: "Management de la diversité",
  short_description: "Adapter son style, valoriser les différences",
  long_description:
    "Une équipe diverse est un atout — à condition de savoir la manager. Personnalités, générations, cultures, modes de fonctionnement : comprendre les différences pour mieux les mobiliser, sans tomber dans les stéréotypes.",
  icon_name: "Users",
  color_theme: "cyan",
  estimated_minutes: 15,
  is_available: true,
  final_badge: {
    name: "Manager inclusif",
    description:
      "Vous valorisez les différences et adaptez votre posture à chaque profil.",
  },
  quizzes: [
    {
      id: "diversite-1-styles",
      title: "Adapter son style managérial",
      description: "Pas une recette unique pour tous",
      tier: "bronze",
      passing_score_percent: 80,
      questions: [
        {
          id: "diversite-1-q1",
          question:
            "Deux collaborateurs reçoivent la même mission. L'un est junior et enthousiaste, l'autre est expert et autonome. Devez-vous les manager différemment ?",
          options: [
            "Oui : le junior a besoin de direction et de soutien, l'expert a besoin d'espace et de confiance.",
            "Non : traiter tout le monde pareillement est plus équitable.",
            "Cela dépend de leurs personnalités, pas de leurs niveaux.",
            "Non : les différences de traitement créent des jalousies.",
          ],
          explanation:
            "L'équité n'est pas l'uniformité. Manager un junior et un expert de la même façon, c'est soit sur-contrôler l'expert (et le démotiver) soit abandonner le junior à lui-même. Le management situationnel dit : adapter le style au niveau de compétence et d'autonomie de chacun sur chaque tâche.",
        },
        {
          id: "diversite-1-q2",
          question:
            "Un collaborateur introverti ne parle jamais en réunion de groupe. Quelle est la bonne interprétation de ce comportement ?",
          options: [
            "Il peut avoir des idées importantes mais les exprimer en grand groupe n'est pas son mode de fonctionnement.",
            "Il n'est pas engagé et ne s'investit pas dans le collectif.",
            "Il a peur de prendre des risques et manque de confiance en lui.",
            "Il est en désaccord avec les décisions mais n'ose pas le dire.",
          ],
          explanation:
            "L'introversion n'est pas un manque d'engagement ou de confiance. Les personnes introverties pensent souvent plus profondément mais ont besoin d'un contexte différent pour s'exprimer : écrire avant, parler en petit groupe, être interpelées directement. Le manager qui adapte le format récolte leurs meilleures contributions.",
        },
        {
          id: "diversite-1-q3",
          question:
            "Votre équipe est composée de profils très différents. Comment vous assurez-vous de ne pas toujours impliquer les mêmes personnes ?",
          options: [
            "Vous créez délibérément des opportunités variées et veillez à qui participe, qui prend la parole, qui est consulté.",
            "Vous laissez les personnes motivées prendre l'initiative.",
            "Vous organisez des rotations systématiques dans les responsabilités.",
            "Vous demandez à l'équipe de s'auto-organiser pour être plus équitable.",
          ],
          explanation:
            "L'inclusion active nécessite une attention délibérée : qui parle en réunion ? Qui est consulté sur les décisions ? Qui reçoit les missions intéressantes ? Sans ce regard, on finit par favoriser naturellement les profils les plus visibles et extravertis, au détriment des autres.",
        },
        {
          id: "diversite-1-q4",
          question:
            "Quelle est la différence entre équité et égalité dans le contexte du management ?",
          options: [
            "L'égalité traite tout le monde de la même façon ; l'équité donne à chacun ce dont il a besoin.",
            "L'équité est réservée aux situations de discrimination ; l'égalité s'applique partout.",
            "L'égalité concerne les salaires, l'équité concerne les avantages.",
            "Il n'y a pas de différence pratique dans le contexte managérial.",
          ],
          explanation:
            "L'égalité donne la même chose à tout le monde, quel que soit le contexte. L'équité donne à chacun ce dont il a spécifiquement besoin pour avoir les mêmes chances. En management : l'équité peut signifier plus de soutien pour un junior, plus d'autonomie pour un expert, un mode de communication adapté à chaque profil.",
        },
        {
          id: "diversite-1-q5",
          question:
            "Un collaborateur vous dit qu'il fonctionne mieux avec des tâches claires et structurées, alors qu'un autre préfère les missions ouvertes. Comment intégrez-vous cela dans votre management ?",
          options: [
            "Vous adaptez la façon de confier les tâches tout en maintenant les mêmes exigences de résultat.",
            "Vous ignorez ces préférences : le travail doit être fait quelle que soit la préférence.",
            "Vous confiez les tâches structurées uniquement au premier, les ouvertes uniquement au second.",
            "Vous challengez les deux pour qu'ils sortent de leur zone de confort.",
          ],
          explanation:
            "Adapter la façon de cadrer les missions (plus ou moins structuré, plus ou moins de liberté sur le 'comment') sans changer les exigences de résultat est un levier puissant d'engagement. Ce n'est pas de la faiblesse — c'est comprendre que les gens performent mieux dans des conditions adaptées à leur mode de fonctionnement.",
        },
      ],
    },
    {
      id: "diversite-2-generations",
      title: "Manager des générations différentes",
      description: "Comprendre sans stéréotyper",
      tier: "silver",
      passing_score_percent: 80,
      questions: [
        {
          id: "diversite-2-q1",
          question:
            "Un jeune collaborateur (25 ans) vous demande régulièrement du feedback et veut connaître sa progression. Comment interprétez-vous cela ?",
          options: [
            "C'est un signal de forte orientation développement — un atout à exploiter.",
            "Il manque de confiance en lui.",
            "Il cherche à se faire remarquer.",
            "Il ne fait pas confiance à son propre jugement.",
          ],
          explanation:
            "Les jeunes collaborateurs ont souvent une forte attente de feedback fréquent et de visibilité sur leur progression — ce que l'école leur avait fourni. Ce n'est pas un manque de confiance, c'est une orientation apprentissage élevée. Un manager qui répond à ce besoin retient et développe ses meilleurs juniors.",
        },
        {
          id: "diversite-2-q2",
          question:
            "Un collaborateur expérimenté (55 ans) résiste à l'adoption d'un nouvel outil numérique. Quelle est l'approche la plus efficace ?",
          options: [
            "Comprendre sa réticence, valoriser son expertise existante, et lui montrer en quoi l'outil facilite son travail.",
            "Le contraindre à l'utiliser pour qu'il s'y habitue.",
            "Demander à un collègue plus jeune de l'aider.",
            "Accepter qu'il n'utilisera pas l'outil et trouver un contournement.",
          ],
          explanation:
            "La résistance à un outil est souvent une peur de devenir incompétent dans son domaine d'excellence. Valoriser l'expertise existante ('tu connais ce processus mieux que personne') et montrer comment l'outil sert cette expertise réduit la menace perçue. Contraindre sans expliquer le sens génère du ressentiment.",
        },
        {
          id: "diversite-2-q3",
          question:
            "Vous avez une équipe multigénérationnelle avec des attentes très différentes sur l'équilibre vie pro/vie perso. Comment gérez-vous cela ?",
          options: [
            "Vous créez le plus de flexibilité possible dans le cadre des contraintes organisationnelles, et discutez des besoins individuellement.",
            "Vous appliquez les mêmes règles à tout le monde pour être fair.",
            "Vous donnez la priorité aux besoins des jeunes parents.",
            "Vous laissez l'équipe s'organiser entre elle.",
          ],
          explanation:
            "L'équilibre vie pro/vie perso n'est pas un droit uniforme mais un besoin individuel. Dans le cadre des contraintes réelles, créer de la flexibilité là où c'est possible et traiter chaque situation individuellement est la posture juste. Les règles rigides 'pour tout le monde' démotivent sans nécessité.",
        },
        {
          id: "diversite-2-q4",
          question:
            "Quel est le danger principal des typologies générationnelles (Boomers, Gen X, Millennials, Gen Z) pour un manager ?",
          options: [
            "Elles peuvent conduire à des stéréotypes et à ignorer les différences individuelles au sein de chaque génération.",
            "Elles sont trop complexes à mémoriser.",
            "Elles ne sont pas fondées sur des données scientifiques.",
            "Elles sont surtout valables aux États-Unis, pas en France.",
          ],
          explanation:
            "Les typologies générationnelles sont des outils de sensibilisation, pas des vérités universelles. Il existe autant de différences individuelles à l'intérieur d'une génération qu'entre les générations. S'y fier aveuglément conduit à des décisions managériales basées sur des suppositions plutôt que sur la connaissance réelle de la personne.",
        },
        {
          id: "diversite-2-q5",
          question:
            "Comment tirer le meilleur parti d'une équipe multigénérationnelle sur un projet complexe ?",
          options: [
            "Créer des binômes mixtes où chaque profil apporte sa perspective spécifique.",
            "Confier les tâches techniques aux plus jeunes et les tâches relationnelles aux plus expérimentés.",
            "Laisser chacun travailler selon ses préférences sans chercher à les mélanger.",
            "Aligner tout le monde sur les méthodes de travail des personnes les plus expérimentées.",
          ],
          explanation:
            "Les binômes multigénérationnels combinent des atouts complémentaires : maîtrise technique récente + expérience terrain, agilité numérique + compréhension des enjeux organisationnels. Le manager qui crée délibérément ces ponts exploite la diversité comme levier de performance.",
        },
      ],
    },
    {
      id: "diversite-3-inclusion",
      title: "Créer un environnement inclusif",
      description: "Où chacun peut être lui-même et contribuer pleinement",
      tier: "gold",
      passing_score_percent: 80,
      questions: [
        {
          id: "diversite-3-q1",
          question:
            "Qu'est-ce que la 'sécurité psychologique' dans une équipe, et pourquoi est-elle liée à la diversité ?",
          options: [
            "Le sentiment que l'on peut s'exprimer, prendre des risques et être soi-même sans craindre de représailles ou de jugement.",
            "L'absence de risques physiques dans l'environnement de travail.",
            "La certitude de ne pas être licencié.",
            "La confiance dans la stabilité financière de l'entreprise.",
          ],
          explanation:
            "La sécurité psychologique (Amy Edmondson) est le terreau de toute équipe diverse et performante : sans elle, les personnes minoritaires ou différentes vont se conformer plutôt que contribuer leur perspective unique. C'est la condition sine qua non pour que la diversité devienne vraiment un atout.",
        },
        {
          id: "diversite-3-q2",
          question:
            "Qu'est-ce qu'un 'micro-agression' dans le contexte du management ?",
          options: [
            "Un commentaire ou comportement apparemment anodin qui véhicule un message de rejet ou d'infériorité envers une personne d'un groupe marginalisé.",
            "Un conflit physique entre collègues.",
            "Une critique professionnelle perçue comme personnelle.",
            "Un manque de reconnaissance répété.",
          ],
          explanation:
            "Les micro-agressions sont souvent involontaires ('tu parles très bien français pour quelqu'un de ta région', 'tu t'en sors bien pour une femme dans ce métier'). Leur effet cumulatif sur les personnes qui les subissent est significatif. Un manager inclusif les reconnaît, les nomme quand elles se produisent, et crée un espace où elles peuvent être signalées.",
        },
        {
          id: "diversite-3-q3",
          question:
            "Un collaborateur de votre équipe se plaint d'avoir été mis de côté dans une décision par ses collègues en raison de son profil différent. Comment réagissez-vous ?",
          options: [
            "Vous prenez le temps d'écouter, d'investiguer, et si c'est avéré, d'en parler directement avec l'équipe.",
            "Vous lui dites que c'est sa perception et que vous ne pouvez pas intervenir sur les perceptions.",
            "Vous remontez immédiatement aux RH.",
            "Vous organisez une formation diversité pour toute l'équipe.",
          ],
          explanation:
            "La première étape est l'écoute authentique, sans minimiser. Ensuite l'investigation factuelle. Puis, si c'est avéré, adresser le sujet avec l'équipe — pas nécessairement en nommant la personne — pour établir des normes claires d'inclusion. Aller aux RH d'emblée ou organiser une formation sans avoir d'abord compris peut être prématuré.",
        },
        {
          id: "diversite-3-q4",
          question:
            "Quelle pratique concrète favorise le plus l'inclusion dans les réunions d'équipe ?",
          options: [
            "Varier les formats pour que les différents modes de contribution puissent s'exprimer (écrit, petit groupe, direct).",
            "Inviter tout le monde sans exception.",
            "Fixer des quotas de temps de parole.",
            "Enregistrer les réunions pour que les absents puissent les visionner.",
          ],
          explanation:
            "Varier les formats de participation est la pratique inclusive la plus efficace : les extravertis s'expriment bien à l'oral, les introvertis préfèrent l'écrit préalable, certains ont besoin d'un petit groupe avant le grand. Proposer systématiquement plusieurs modes ('envoyez vos idées avant', 'discussion par groupes de 2', 'plénière') crée de l'équité dans la participation.",
        },
        {
          id: "diversite-3-q5",
          question:
            "Quel est le risque de la 'diversité de façade' dans une équipe ?",
          options: [
            "Elle crée des apparences de diversité sans changer les dynamiques réelles de pouvoir et d'inclusion.",
            "Elle coûte cher en termes de recrutement.",
            "Elle suscite des tensions entre les collaborateurs.",
            "Elle complique la communication interne.",
          ],
          explanation:
            "Avoir une équipe visuellement diverse sans avoir travaillé sur l'inclusion réelle (qui a vraiment voix au chapitre, dont les idées sont entendues et valorisées, qui accède aux opportunités) est une diversité de façade. Elle peut même être contre-productive : les personnes recrutées pour 'la diversité' mais pas vraiment incluses finissent par partir, déçues.",
        },
      ],
    },
    {
      id: "diversite-final",
      title: "Examen final — Management de la diversité",
      description: "Mise en situation de bout en bout",
      tier: "final",
      passing_score_percent: 80,
      questions: [
        {
          id: "diversite-final-q1",
          question:
            "Quelle est la différence fondamentale entre tolérer la diversité et la valoriser ?",
          options: [
            "Tolérer la diversité signifie l'accepter passivement ; la valoriser signifie chercher activement à en tirer parti.",
            "Tolérer concerne les différences culturelles, valoriser concerne les différences de compétences.",
            "Il n'y a pas de différence pratique.",
            "Valoriser la diversité est une obligation légale, tolérer est un choix.",
          ],
          explanation:
            "Tolérer, c'est accepter que les différences existent. Valoriser, c'est comprendre que ces différences sont une source de richesse et créer activement les conditions pour qu'elles s'expriment. Un manager qui valorise la diversité cherche les perspectives différentes, les crée si elles manquent, et construit sur elles.",
        },
        {
          id: "diversite-final-q2",
          question:
            "Vous observez que dans vos réunions, ce sont toujours les mêmes personnes qui prennent la parole. Quelle action concrète prenez-vous ?",
          options: [
            "Vous changez le format des réunions et sollicitez explicitement des contributions variées.",
            "Vous attendez que les plus silencieux se sentent prêts.",
            "Vous interpellez directement les personnes qui ne parlent pas pour recueillir leur avis.",
            "Vous réduisez la taille du groupe pour que chacun soit plus à l'aise.",
          ],
          explanation:
            "Changer le format est plus systémique et moins intrusif qu'interpeler directement (qui peut mettre mal à l'aise). Demander des contributions écrites avant, travailler en sous-groupes, varier qui anime : ces changements de format redistribuent naturellement la parole sans forcer.",
        },
        {
          id: "diversite-final-q3",
          question:
            "Un collaborateur étranger semble souvent en retrait dans l'équipe et peu à l'aise dans les interactions informelles. Quelle est la première démarche ?",
          options: [
            "Lui proposer un 1:1 pour comprendre comment il vit son intégration et ce qui pourrait l'aider.",
            "Lui suggérer de faire plus d'efforts pour s'intégrer.",
            "Organiser des événements sociaux pour l'intégrer.",
            "Laisser du temps : l'intégration se fait naturellement.",
          ],
          explanation:
            "L'intégration d'un collaborateur dans un contexte culturellement différent nécessite un accompagnement actif. Un 1:1 sincère — 'comment tu vis ton intégration ici, qu'est-ce qui t'aiderait ?' — lui donne la parole sans présumer. C'est la base de toute démarche inclusive : demander avant de supposer.",
        },
        {
          id: "diversite-final-q4",
          question:
            "Votre équipe a tendance à n'écouter que les idées de ses membres les plus seniors. Comment cassez-vous cette dynamique ?",
          options: [
            "Vous créez des espaces où les idées sont présentées anonymement ou dans un ordre qui inverse la hiérarchie habituelle.",
            "Vous demandez aux seniors de moins parler.",
            "Vous demandez aux juniors de développer leur assurance.",
            "Vous n'intervenez pas : la légitimité se mérite.",
          ],
          explanation:
            "Les biais hiérarchiques dans les échanges d'idées sont réels et documentés. Présenter les idées de façon anonyme (vote d'idées), faire parler les juniors en premier, donner le temps de réflexion écrit avant la discussion orale : ces techniques structurelles cassent les dynamiques de statut sans humilier personne.",
        },
        {
          id: "diversite-final-q5",
          question:
            "Un collaborateur vous fait remarquer une décision qui l'a exclu en raison de son profil. Vous ne pensez pas avoir eu cette intention. Comment répondez-vous ?",
          options: [
            "Vous reconnaissez son expérience, remerciez-le de l'avoir exprimé, et examinez la décision à la lumière de son retour.",
            "Vous lui expliquez que ce n'était pas votre intention et que sa perception est erronée.",
            "Vous lui dites que vous essayez de traiter tout le monde pareillement.",
            "Vous évitez de le prendre personnellement et passez à autre chose.",
          ],
          explanation:
            "L'intention ne détermine pas l'impact. Dire 'ce n'était pas mon intention' invalide l'expérience de la personne. Accueillir son retour, reconnaître qu'il peut avoir raison même si ce n'était pas voulu, et revoir la décision à cette lumière : c'est la posture inclusive. C'est aussi ce qui construit la confiance.",
        },
        {
          id: "diversite-final-q6",
          question:
            "Quel est le lien entre sécurité psychologique et performance d'équipe ?",
          options: [
            "Les équipes avec une haute sécurité psychologique apprennent mieux, innovent davantage et sont plus performantes.",
            "Il n'y a pas de lien démontré.",
            "La sécurité psychologique réduit la performance car les gens prennent moins de risques.",
            "Elle favorise la performance individuelle mais pas collective.",
          ],
          explanation:
            "L'étude Google 'Project Aristotle' a montré que la sécurité psychologique est le premier facteur de performance des équipes, loin devant les compétences individuelles. Quand les gens peuvent prendre des risques, exprimer des doutes et signaler des erreurs sans craindre le jugement, l'équipe apprend plus vite et performe mieux.",
        },
        {
          id: "diversite-final-q7",
          question:
            "Vous recrutez pour un poste senior. Vous avez deux candidats à égalité : l'un ressemble beaucoup à vos meilleurs profils actuels, l'autre apporte une perspective différente. Comment décidez-vous ?",
          options: [
            "Vous évaluez explicitement ce que chacun apporterait que l'équipe n'a pas encore.",
            "Vous choisissez le profil similaire : il s'intégrera plus facilement.",
            "Vous choisissez le profil différent systématiquement pour diversifier.",
            "Vous faites décider l'équipe.",
          ],
          explanation:
            "À compétences égales, la question n'est pas 'qui ressemble le plus à ce qu'on a déjà' mais 'que manque-t-il à l'équipe, et lequel des deux l'apporte ?'. Ce n'est pas une question de diversité pour la forme, c'est une question de complémentarité réfléchie. Le biais de similitude est l'un des plus destructeurs en recrutement.",
        },
        {
          id: "diversite-final-q8",
          question:
            "Quelle est la responsabilité principale du manager dans la création d'une culture inclusive ?",
          options: [
            "Modéliser lui-même les comportements inclusifs au quotidien.",
            "Organiser des formations diversité pour sensibiliser l'équipe.",
            "Signaler à la DRH tout comportement discriminatoire.",
            "S'assurer que les politiques RH de l'entreprise sont respectées.",
          ],
          explanation:
            "Le manager est le premier levier de culture inclusive. Ce qu'il fait — pas ce qu'il dit — définit ce qui est normal dans l'équipe. S'il écoute les silencieux, valorise les perspectives différentes, nomme les dynamiques d'exclusion quand il les voit, son équipe le reproduit. La formation et les politiques RH ont peu d'impact sans ce modèle comportemental.",
        },
      ],
    },
  ],
};
