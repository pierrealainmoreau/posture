import type { AcademiePathway } from "@/lib/types";

export const ENTRETIENS_PATHWAY: AcademiePathway = {
  id: "entretiens",
  title: "Conduite d'entretiens",
  short_description: "Recadrage, évaluation, 1:1 — sans les redouter",
  long_description:
    "L'entretien individuel est l'outil le plus puissant du manager — et le plus sous-utilisé. Recadrer sans blesser, évaluer avec justesse, accompagner dans les moments difficiles : des situations qui se préparent et s'apprennent.",
  icon_name: "MessageSquare",
  color_theme: "teal",
  estimated_minutes: 15,
  is_available: true,
  final_badge: {
    name: "Manager en entretien",
    description:
      "Vous conduisez vos entretiens avec clarté, bienveillance et impact.",
  },
  quizzes: [
    {
      id: "entretiens-1-structure",
      title: "Structurer un entretien efficace",
      description: "Préparer, cadrer, conclure",
      tier: "bronze",
      passing_score_percent: 80,
      questions: [
        {
          id: "entretiens-1-q1",
          question:
            "Quelle est la règle d'or pour qu'un entretien individuel soit efficace, quelle qu'en soit la nature ?",
          options: [
            "Il doit être préparé par les deux parties, avec un objectif clair.",
            "Il doit durer au moins une heure.",
            "Il doit se tenir en dehors des locaux professionnels.",
            "Il doit toujours commencer par un temps informel.",
          ],
          explanation:
            "Un entretien sans préparation et sans objectif clair est une conversation. La préparation (des deux côtés) et la clarté de l'objectif — 'aujourd'hui on parle de ton bilan semestriel' vs 'on a un problème à résoudre ensemble' — conditionne la qualité des échanges et la sécurité psychologique des deux parties.",
        },
        {
          id: "entretiens-1-q2",
          question:
            "Vous devez mener un entretien de recadrage avec Thomas suite à plusieurs retards répétés. Comment commencez-vous ?",
          options: [
            "Par des faits observables et datés, sans interprétation ni jugement.",
            "Par rappeler les règles de l'entreprise sur la ponctualité.",
            "Par lui demander s'il est conscient que son comportement pose un problème.",
            "Par un temps de mise à l'aise pour éviter les tensions.",
          ],
          explanation:
            "Commencer par des faits concrets et datés ('j'ai observé 4 retards sur les 3 dernières semaines') pose une base factuelle incontestable. Commencer par les règles ou par une question suggestive met directement le collaborateur en position défensive. Les faits d'abord, le dialogue ensuite.",
        },
        {
          id: "entretiens-1-q3",
          question:
            "Quelle est la structure la plus efficace pour un entretien d'évaluation annuelle ?",
          options: [
            "Collaborateur s'auto-évalue d'abord, puis le manager partage sa vision, puis co-construction des objectifs.",
            "Manager parle des points forts, puis des axes d'amélioration, puis des objectifs.",
            "Le manager lit son évaluation écrite et laisse le collaborateur réagir.",
            "On commence par les objectifs de l'année suivante pour aller de l'avant.",
          ],
          explanation:
            "L'auto-évaluation en premier est fondamentale : elle révèle la perception du collaborateur, évite les surprises, et crée un dialogue plutôt qu'un monologue évaluatif. Comparer ensuite les deux visions permet d'identifier les convergences et les écarts — bien plus riche qu'une lecture descendante.",
        },
        {
          id: "entretiens-1-q4",
          question:
            "Comment conclure efficacement un entretien difficile (recadrage, désaccord) ?",
          options: [
            "En résumant les décisions prises, les engagements mutuels et les prochaines étapes.",
            "En récapitulant les points négatifs pour qu'ils soient bien compris.",
            "En demandant au collaborateur s'il est d'accord avec tout ce qui a été dit.",
            "En passant sur un ton positif pour clore sur une bonne note.",
          ],
          explanation:
            "Une conclusion solide d'entretien difficile résume factuellement : ce qui a été dit, ce qui a été décidé, les engagements de chaque partie, et quand on fera le point. Cela évite les malentendus post-entretien et donne à chacun une base claire. Un simple 'on s'en reparle' est trop vague.",
        },
        {
          id: "entretiens-1-q5",
          question:
            "À quelle fréquence idéale un manager devrait-il tenir des entretiens individuels réguliers (1:1) avec chaque collaborateur ?",
          options: [
            "Toutes les deux semaines environ, adaptées au contexte.",
            "Une fois par an, lors de l'entretien annuel.",
            "Uniquement quand un problème se pose.",
            "Tous les jours pour maintenir le lien.",
          ],
          explanation:
            "Les 1:1 bi-hebdomadaires (toutes les 1-2 semaines) sont le standard recommandé. Ils permettent de suivre l'avancement, de détecter les difficultés tôt, et de maintenir la relation. Trop rares, ils deviennent des entretiens de crise. Trop fréquents, ils deviennent chronophages et infantilisants.",
        },
      ],
    },
    {
      id: "entretiens-2-recadrage",
      title: "L'entretien de recadrage",
      description: "Dire ce qui ne va pas sans blesser la relation",
      tier: "silver",
      passing_score_percent: 80,
      questions: [
        {
          id: "entretiens-2-q1",
          question:
            "Quelle est la différence entre un recadrage et une sanction ?",
          options: [
            "Le recadrage vise à corriger un comportement en préservant la relation ; la sanction est une conséquence formelle d'une faute.",
            "Le recadrage est oral, la sanction est écrite.",
            "Le recadrage est fait par le manager, la sanction par les RH.",
            "Il n'y a pas de différence : les deux transmettent un mécontentement.",
          ],
          explanation:
            "Le recadrage est un outil de développement : il dit ce qui ne va pas, pourquoi, et ce qu'on attend à la place. L'objectif est le changement de comportement, pas la punition. La sanction est une démarche formelle qui intervient quand le recadrage n'a pas suffi ou face à une faute avérée.",
        },
        {
          id: "entretiens-2-q2",
          question:
            "Vous devez recadrer Sarah sur sa façon de répondre aux demandes clients. Quelle formulation est la plus adaptée ?",
          options: [
            "\"J'ai reçu des retours sur ton échange avec le client X lundi. Voici ce qui a été observé... Quel est ton point de vue là-dessus ?\"",
            "\"Tu n'as pas la bonne attitude avec les clients, il faut que ça change.\"",
            "\"Tu sais que la relation client est importante, j'espère que tu vas faire des efforts.\"",
            "\"Je vais être obligé d'escalader si tu ne changes pas rapidement.\"",
          ],
          explanation:
            "Un recadrage efficace : s'appuie sur des faits observables (pas des jugements), laisse la place à la version du collaborateur, et ouvre un dialogue. La menace d'escalade immédiate ferme la discussion. 'Tu n'as pas la bonne attitude' est une attaque identitaire, pas un feedback comportemental.",
        },
        {
          id: "entretiens-2-q3",
          question:
            "Pendant un entretien de recadrage, votre collaborateur se met sur la défensive et contre-attaque sur votre propre management. Quelle est la meilleure posture ?",
          options: [
            "Vous accusez réception de sa perception sans la valider entièrement, et ramenez le sujet du recadrage.",
            "Vous défendez votre position avec des arguments solides.",
            "Vous clôturez la réunion pour éviter l'escalade.",
            "Vous lui proposez un second entretien sur ce qu'il a soulevé, après avoir clôturé l'entretien actuel.",
          ],
          explanation:
            "Accuser réception sans valider : 'j'entends que tu as une perception différente de ma façon de manager, on pourra en parler. Là, je voudrais qu'on finisse d'abord sur le sujet qui nous réunit.' Cela désamorce sans céder. Clôturer précipitamment laisse le sujet en suspens. Se défendre immédiatement bascule l'entretien dans un conflit.",
        },
        {
          id: "entretiens-2-q4",
          question:
            "Combien de sujets de recadrage devrait-on aborder dans un même entretien ?",
          options: [
            "Un seul sujet principal, pour que le message soit clair et mémorisable.",
            "Autant que nécessaire pour couvrir tous les problèmes en attente.",
            "Deux sujets maximum, pour montrer l'ampleur du problème.",
            "Cela dépend du temps disponible.",
          ],
          explanation:
            "Un recadrage par entretien est la règle d'or. Accumuler plusieurs sujets négatifs dans une même conversation crée un effet 'pile de reproches' qui dépasse le collaborateur et le met en position défensive globale. Un message fort sur un sujet unique est bien plus efficace qu'une liste.",
        },
        {
          id: "entretiens-2-q5",
          question:
            "Après un entretien de recadrage, le collaborateur dit 'oui' à tout mais vous sentez qu'il n'est pas réellement convaincu. Que faites-vous ?",
          options: [
            "Vous lui demandez ce qu'il pense vraiment et si ce qui a été dit lui semble juste.",
            "Vous prenez son accord et passez à autre chose.",
            "Vous documentez son accord pour vous protéger.",
            "Vous planifiez immédiatement un entretien de suivi dans une semaine.",
          ],
          explanation:
            "Un accord de façade ne mène à aucun changement. Prendre le temps de vérifier la compréhension réelle — 'Est-ce que ce qu'on vient de dire te semble juste ? Y a-t-il quelque chose que tu n'es pas prêt à accepter ?' — est risqué mais nécessaire. Un désaccord exprimé est plus utile qu'un silence convenu.",
        },
      ],
    },
    {
      id: "entretiens-3-situations-difficiles",
      title: "Les entretiens à enjeux forts",
      description: "Départ, échec, annonce difficile",
      tier: "gold",
      passing_score_percent: 80,
      questions: [
        {
          id: "entretiens-3-q1",
          question:
            "Un collaborateur vient vous annoncer sa démission. Quelle est votre première réaction ?",
          options: [
            "L'écouter sans chercher à le convaincre immédiatement, comprendre ses raisons.",
            "Tenter immédiatement de le retenir avec une contre-offre.",
            "Lui demander si c'est bien réfléchi.",
            "Informer les RH avant la fin de l'entretien.",
          ],
          explanation:
            "Avant toute chose, écouter. Une démission est une décision souvent longuement mûrie. Comprendre les raisons réelles (même si vous ne pouvez rien changer) est précieux pour l'équipe et pour vous. Une contre-offre immédiate peut sembler désespérée et rarement résout les causes profondes du départ.",
        },
        {
          id: "entretiens-3-q2",
          question:
            "Vous devez annoncer à un collaborateur qu'il n'obtiendra pas la promotion qu'il attendait. Comment structurez-vous cet entretien ?",
          options: [
            "Vous annoncez la décision clairement, expliquez les raisons concrètes, reconnaissez la déception, et ouvrez sur la suite.",
            "Vous lui annoncez la décision sans détails pour rester factuel.",
            "Vous expliquez d'abord vos contraintes pour qu'il comprenne que ce n'est pas votre faute.",
            "Vous attendez que la question vienne de lui pour éviter un entretien difficile.",
          ],
          explanation:
            "La structure : clarté de la décision (sans tourner autour), raisons concrètes (pas 'il y avait des candidats plus expérimentés' mais des éléments factuels), reconnaissance de la déception (ne pas l'esquiver), et ouverture sur la suite (qu'est-ce qui ouvre d'autres voies). Expliquer vos contraintes en premier est une façon de se protéger plutôt que d'aider.",
        },
        {
          id: "entretiens-3-q3",
          question:
            "Un collaborateur s'effondre en larmes pendant un entretien d'évaluation. Quelle est la bonne posture ?",
          options: [
            "Mettre l'entretien en pause, reconnaître son émotion sans la minimiser, et proposer de reprendre quand il sera prêt.",
            "Continuer l'entretien pour ne pas lui donner l'impression que ses émotions lui permettent d'éviter les sujets difficiles.",
            "Conclure immédiatement l'entretien pour lui donner de l'espace.",
            "Lui demander de se ressaisir pour pouvoir continuer.",
          ],
          explanation:
            "Les émotions fortes signalent que quelque chose de important est en jeu. Mettre en pause (pas arrêter), reconnaître sans minimiser ('je vois que c'est difficile, c'est normal'), et laisser le collaborateur reprendre le contrôle est la seule posture humaine et efficace. Lui demander de 'se ressaisir' est une forme de violence.",
        },
        {
          id: "entretiens-3-q4",
          question:
            "Vous devez faire un entretien de retour de longue absence (maladie, burn-out) avec un collaborateur. Quelle en est l'intention principale ?",
          options: [
            "Créer un espace de réaccueil, comprendre sa situation actuelle, et co-construire les conditions d'un retour progressif.",
            "Mettre à jour le collaborateur sur ce qui s'est passé pendant son absence.",
            "Vérifier qu'il est apte à reprendre ses fonctions.",
            "Recadrer sur les attentes de performance dès la reprise.",
          ],
          explanation:
            "L'entretien de retour d'absence n'est pas une mise à jour ni une vérification d'aptitude — c'est un sas de réintégration. L'intention est relationnelle et sécurisante : comment se sent-il, ce dont il a besoin, comment on peut adapter le retour. Parler de performance dans ce contexte est prématuré et contre-productif.",
        },
        {
          id: "entretiens-3-q5",
          question:
            "Un collaborateur conteste vivement votre évaluation de sa performance. Il est convaincu de mériter mieux. Comment gérez-vous ce désaccord ?",
          options: [
            "Vous reconnaissez sa perception, demandez ce sur quoi il fonde son évaluation, et partagez vos critères factuels clairement.",
            "Vous maintenez votre évaluation ferme et lui expliquez que c'est votre rôle de décider.",
            "Vous révisez votre évaluation pour éviter le conflit.",
            "Vous lui proposez de s'adresser aux RH s'il n'est pas d'accord.",
          ],
          explanation:
            "Un désaccord sur une évaluation révèle souvent des critères de performance mal alignés en amont. La bonne posture : écouter sur quoi le collaborateur fonde son auto-évaluation, partager vos critères factuels de façon transparente, et identifier l'écart de perception. On peut maintenir une évaluation tout en reconnaissant une perception différente — sans capituler ni écraser.",
        },
      ],
    },
    {
      id: "entretiens-final",
      title: "Examen final — Conduite d'entretiens",
      description: "Mise en situation de bout en bout",
      tier: "final",
      passing_score_percent: 80,
      questions: [
        {
          id: "entretiens-final-q1",
          question:
            "Quelle est la condition numéro un pour qu'un entretien individuel crée de la confiance ?",
          options: [
            "Que ce qui s'y dit reste confidentiel et ne soit pas utilisé contre le collaborateur.",
            "Qu'il soit régulier et planifié.",
            "Qu'il soit mené par le manager direct.",
            "Qu'il soit documenté pour les RH.",
          ],
          explanation:
            "La confiance dans les 1:1 repose sur une règle implicite mais fondamentale : ce qui est dit dans cet espace ne se retourne pas contre le collaborateur. Si les gens sentent que leurs difficultés ou leurs doutes peuvent être utilisés pour les évaluer négativement, ils cesseront de parler franchement.",
        },
        {
          id: "entretiens-final-q2",
          question:
            "Vous préparez un entretien de recadrage sur des délais non tenus. Quelle information est indispensable à avoir avant l'entretien ?",
          options: [
            "Les faits précis : quels délais, quelles dates, quel impact observé.",
            "L'historique de performance du collaborateur sur l'année.",
            "L'avis des RH sur la situation.",
            "La réaction probable du collaborateur.",
          ],
          explanation:
            "Un recadrage sans faits précis est un ressenti, pas un entretien. Préparer les dates, les livrables concernés, les conséquences observées est le travail préalable indispensable. Cela protège le manager ('j'ai les faits') et crée une base incontestable pour le dialogue.",
        },
        {
          id: "entretiens-final-q3",
          question:
            "Dans un entretien de développement, quelle posture génère le plus de progression chez le collaborateur ?",
          options: [
            "Le manager qui pose des questions ouvertes pour que le collaborateur développe lui-même ses propres réponses.",
            "Le manager qui donne ses conseils et son expérience.",
            "Le manager qui partage des exemples de réussite d'autres collaborateurs.",
            "Le manager qui fixe des objectifs ambitieux et challengeants.",
          ],
          explanation:
            "Le questionnement est plus développant que le conseil : 'Selon toi, qu'est-ce qui t'a bloqué ?' ou 'Comment tu t'y prendrais différemment ?' construisent l'autonomie de pensée. Le conseil, même excellent, crée une dépendance et est moins mémorisable que ce qu'on a soi-même découvert.",
        },
        {
          id: "entretiens-final-q4",
          question:
            "Vous recevez un collaborateur qui a eu un conflit sérieux avec un collègue. Quelle est l'erreur à éviter absolument ?",
          options: [
            "Prendre parti pour l'un ou l'autre avant d'avoir entendu les deux.",
            "Poser des questions pour comprendre sa version.",
            "Partager votre propre lecture de la situation.",
            "Proposer une médiation avec les deux parties.",
          ],
          explanation:
            "Prendre parti sur la base d'une seule version est l'erreur classique et la plus destructrice. Même si la version entendue semble évidente, il manque toujours des éléments. Écouter, questionner, puis rencontrer l'autre partie avant de conclure quoi que ce soit : c'est la règle d'or du manager médiateur.",
        },
        {
          id: "entretiens-final-q5",
          question:
            "Comment savez-vous qu'un entretien de recadrage a été efficace ?",
          options: [
            "Un changement de comportement est observable dans les semaines suivantes.",
            "Le collaborateur a accepté tout ce que vous avez dit.",
            "Le collaborateur n'a pas pleuré et est ressorti calmement.",
            "Vous vous êtes senti clair et assertif pendant l'entretien.",
          ],
          explanation:
            "L'unique indicateur réel d'un recadrage efficace est le changement de comportement observable. Un accord en entretien ne signifie rien s'il n'est pas suivi d'effet. C'est pourquoi un point de suivi planifié est toujours nécessaire après un recadrage : il formalise l'engagement et vérifie l'impact réel.",
        },
        {
          id: "entretiens-final-q6",
          question:
            "Vous devez conduire l'entretien annuel de Marc, qui a eu une année compliquée (objectifs non atteints, tensions avec un collègue). Quelle est votre préparation prioritaire ?",
          options: [
            "Préparer une évaluation équilibrée : ce qui n'a pas marché ET ce qui a bien marché, avec des faits pour les deux.",
            "Rassembler tous les éléments négatifs de l'année pour être complet.",
            "Prévoir comment vous allez annoncer les mauvaises nouvelles sans qu'il le vive trop mal.",
            "Demander aux RH de participer pour éviter d'être seul face à une réaction difficile.",
          ],
          explanation:
            "Même une mauvaise année contient des éléments positifs. Une évaluation unilatéralement négative est perçue comme injuste, même si les constats sont factuels. Préparer les deux faces — avec des faits pour chacune — permet un dialogue équilibré et préserve la dignité du collaborateur.",
        },
        {
          id: "entretiens-final-q7",
          question:
            "Quelle est la durée idéale pour un 1:1 hebdomadaire ou bi-hebdomadaire ?",
          options: [
            "30 minutes environ, avec un agenda léger et flexible.",
            "Au moins 2 heures pour traiter tous les sujets.",
            "15 minutes maximum pour rester focalisé.",
            "Cela n'a pas d'importance si la conversation est de qualité.",
          ],
          explanation:
            "30 minutes est le format optimal pour un 1:1 régulier : assez long pour créer un espace de dialogue réel, assez court pour rester focalisé et ne pas devenir une réunion de reporting. L'agenda léger et flexible — souvent co-construit — permet d'aborder ce qui compte vraiment pour le collaborateur.",
        },
        {
          id: "entretiens-final-q8",
          question:
            "Un collaborateur arrive à un entretien de recadrage en ayant appris par un collègue qu'il allait être recadré. Quelle est la première conséquence à anticiper ?",
          options: [
            "Il sera probablement sur la défensive avant même que vous ayez ouvert la bouche.",
            "Il sera mieux préparé, ce qui rendra l'entretien plus productif.",
            "Il pourra avoir préparé des contre-arguments solides.",
            "Il aura eu le temps de changer de comportement avant l'entretien.",
          ],
          explanation:
            "Apprendre un recadrage par un tiers active immédiatement la défensive et détruit la confiance dans l'espace de dialogue. C'est pourquoi la confidentialité et la discrétion dans la préparation des entretiens difficiles sont essentielles. L'effet de surprise contrôlée est bien moins dommageable que l'effet rumeur.",
        },
      ],
    },
  ],
};
