import type { AcademiePathway } from "@/lib/types";

export const CONFLICTS_PATHWAY: AcademiePathway = {
  id: "conflicts",
  title: "Gestion des conflits",
  short_description: "Désamorcer les tensions dans l'équipe",
  long_description:
    "Identifier les sources de conflit, intervenir au bon moment, faire émerger les besoins sans prendre parti. Une compétence clé du manager moderne.",
  icon_name: "Handshake",
  color_theme: "amber",
  estimated_minutes: 15,
  is_available: true,
  final_badge: {
    name: "Médiateur d'équipe",
    description: "Vous savez désamorcer un conflit sans le fuir ni l'envenimer.",
  },
  quizzes: [
    {
      id: "conflicts-1-detection",
      title: "Détecter les signaux faibles",
      description: "Voir le conflit avant qu'il n'explose",
      tier: "bronze",
      passing_score_percent: 80,
      questions: [
        {
          id: "conflicts-1-q1",
          question:
            "Lequel de ces signaux est le PLUS révélateur d'un conflit latent dans une équipe ?",
          options: [
            "Deux personnes qui ne se sollicitent plus en réunion alors qu'elles le faisaient avant.",
            "Une personne qui critique ouvertement une autre devant le manager.",
            "Une baisse de productivité sur un sprint donné.",
            "Un désaccord exprimé sur un choix technique.",
          ],
          explanation:
            "L'évitement actif est le signal le plus fiable d'un conflit installé. La critique ouverte est souvent moins grave car elle reste verbalisable. Un désaccord technique n'est pas un conflit. Une baisse de productivité a souvent d'autres causes.",
        },
        {
          id: "conflicts-1-q2",
          question:
            "Un collaborateur qui était très bavard en réunion devient soudainement silencieux depuis deux semaines. Quelle est la lecture la plus appropriée ?",
          options: [
            "C'est un signal à investiguer : quelque chose a peut-être changé dans sa motivation ou ses relations.",
            "Il est probablement épuisé par une surcharge de travail ponctuelle.",
            "Il a décidé d'adopter un profil plus discret, c'est une maturité.",
            "C'est son droit de ne pas s'exprimer, inutile d'intervenir.",
          ],
          explanation:
            "Un changement comportemental marqué est toujours un signal à prendre au sérieux. Le manager doit investiguer en privé, sans projeter ni ignorer.",
        },
        {
          id: "conflicts-1-q3",
          question:
            "Lors d'une rétrospective d'équipe, vous remarquez que deux membres évitent systématiquement de se regarder. Que faites-vous ?",
          options: [
            "Vous notez l'observation et planifiez un 1:1 avec chacun pour explorer la situation.",
            "Vous leur demandez directement devant le groupe si tout va bien entre eux.",
            "Vous ne faites rien — ce n'est pas votre rôle de gérer les relations interpersonnelles.",
            "Vous envoyez un email à toute l'équipe pour rappeler les règles de coopération.",
          ],
          explanation:
            "Observer sans intervenir publiquement est la bonne posture initiale. Le 1:1 privé permet d'explorer sans braquer. Interpeller en public aggrave souvent la situation.",
        },
        {
          id: "conflicts-1-q4",
          question:
            "Quel comportement indique qu'un conflit a dépassé le stade latent et est devenu manifeste ?",
          options: [
            "Un collaborateur refuse explicitement de travailler avec un autre sur un projet commun.",
            "Deux collègues ont des échanges animés mais se résolvent seuls après la réunion.",
            "Un membre de l'équipe arrive souvent en retard aux stand-ups.",
            "L'équipe produit moins que prévu ce trimestre.",
          ],
          explanation:
            "Le refus explicite de collaboration est une escalade claire : le conflit est sorti du domaine implicite. Les autres situations restent ambiguës et peuvent avoir des causes distinctes.",
        },
        {
          id: "conflicts-1-q5",
          question:
            "Lequel de ces contextes organisationnels est le plus propice à l'émergence de conflits ?",
          options: [
            "Des rôles flous avec des périmètres de responsabilité qui se chevauchent.",
            "Un manager très présent qui fait des points hebdomadaires avec chaque collaborateur.",
            "Une équipe qui a des rituels collectifs réguliers (retrospectives, team lunches).",
            "Un objectif commun clair sur le trimestre.",
          ],
          explanation:
            "Les rôles flous créent des conflits de territoire et de légitimité. La clarté des périmètres, des rituels et des objectifs communs est un puissant amortisseur de conflits.",
        },
      ],
    },
    {
      id: "conflicts-2-posture",
      title: "La posture du médiateur",
      description: "Ni juge ni complice : neutre actif",
      tier: "silver",
      passing_score_percent: 80,
      questions: [
        {
          id: "conflicts-2-q1",
          question:
            "Un collaborateur vient vous voir pour se plaindre d'un collègue. Quelle est la meilleure première réaction ?",
          options: [
            "Écouter sans prendre parti, puis proposer de rencontrer les deux parties séparément.",
            "Lui donner raison pour maintenir la confiance et lui montrer que vous le soutenez.",
            "Convoquer immédiatement les deux personnes pour une mise au point collective.",
            "Lui dire que vous allez régler ça et contacter directement l'autre collaborateur.",
          ],
          explanation:
            "Le médiateur écoute d'abord une partie sans se positionner, puis recueille la version de l'autre. Prendre parti ou agir sans entendre les deux côtés détruit la neutralité.",
        },
        {
          id: "conflicts-2-q2",
          question:
            "Vous avez plus de sympathie personnelle pour l'un des deux protagonistes d'un conflit. Comment gérez-vous cela ?",
          options: [
            "Vous en prenez conscience et redoublez d'attention pour écouter l'autre partie avec la même ouverture.",
            "Vous vous retirez du processus de médiation pour éviter le biais.",
            "Vous assumez ce biais mais compensez en étant plus dur avec la personne que vous appréciez.",
            "Vous ne mentionnez pas votre préférence et conduisez la médiation normalement.",
          ],
          explanation:
            "La conscience du biais est déjà une grande partie de la solution. Se retirer n'est pas toujours possible. Compenser artificiellement produit des distorsions. La clé est l'écoute délibérément équitable des deux côtés.",
        },
        {
          id: "conflicts-2-q3",
          question:
            "Lors d'une médiation entre deux collaborateurs, l'un d'eux dit : 'Il ment, demandez-lui.' Que faites-vous ?",
          options: [
            "Recentrez la conversation sur les faits et les ressentis plutôt que sur les accusations.",
            "Demandez à l'autre collaborateur de répondre à l'accusation.",
            "Sortez les mails ou preuves disponibles pour arbitrer sur les faits.",
            "Suspendez la médiation et renvoyez chacun à ses activités.",
          ],
          explanation:
            "Le médiateur ne juge pas la vérité des faits — il crée un espace pour que chacun exprime ses besoins. Recentrer sur le ressenti ('qu'est-ce que cette situation provoque pour toi ?') est plus productif qu'arbitrer.",
        },
        {
          id: "conflicts-2-q4",
          question:
            "Quelle posture définit le mieux un 'médiateur neutre actif' ?",
          options: [
            "Il crée les conditions du dialogue sans imposer de solution, tout en structurant activement la conversation.",
            "Il reste en retrait et laisse les parties trouver leur propre accord sans intervenir.",
            "Il identifie la partie qui a tort et l'amène à reconnaître son erreur.",
            "Il propose une solution équitable que les deux parties doivent accepter.",
          ],
          explanation:
            "La neutralité active signifie structurer (poser des questions, reformuler, recadrer) sans orienter le fond. Le médiateur facilite, il ne décide pas.",
        },
        {
          id: "conflicts-2-q5",
          question:
            "Quelle question est la PLUS utile pour aider un collaborateur à sortir d'une posture accusatrice lors d'un conflit ?",
          options: [
            "'Qu'est-ce dont tu aurais besoin pour travailler sereinement avec cette personne ?'",
            "'Tu penses vraiment qu'il a agi intentionnellement ?'",
            "'Qu'est-ce que tu as fait de ton côté pour améliorer la situation ?'",
            "'Quel résultat veux-tu que j'obtienne de l'autre ?'",
          ],
          explanation:
            "Orienter la question vers le besoin personnel déplace l'attention de l'autre vers soi. C'est la clé pour sortir du mode accusatoire et entrer dans le mode solution.",
        },
      ],
    },
    {
      id: "conflicts-3-resolution",
      title: "Faire émerger une issue",
      description: "Du besoin à l'accord",
      tier: "gold",
      passing_score_percent: 80,
      questions: [
        {
          id: "conflicts-3-q1",
          question:
            "Après avoir entendu les deux parties séparément, quelle est l'étape suivante la plus efficace ?",
          options: [
            "Organiser une rencontre à trois avec un cadre clair et des règles de parole définies à l'avance.",
            "Résumer vos conclusions aux deux parties et leur proposer votre solution.",
            "Envoyer un compte-rendu écrit à chacun avec les points de tension identifiés.",
            "Attendre quelques jours pour voir si la situation se régule d'elle-même.",
          ],
          explanation:
            "La réunion à trois, cadrée avec des règles de parole, permet aux deux parties de s'entendre mutuellement — condition indispensable pour construire un accord durable.",
        },
        {
          id: "conflicts-3-q2",
          question:
            "Lors d'une réunion de médiation, un des deux collaborateurs monopolise la parole. Que faites-vous ?",
          options: [
            "Vous intervenez doucement pour redonner la parole à l'autre : 'Je voudrais maintenant entendre la perspective de [prénom].'",
            "Vous laissez aller — couper quelqu'un qui parle risque de le braquer.",
            "Vous demandez à la personne silencieuse si elle a quelque chose à dire.",
            "Vous suspendez la réunion et la reprogrammez à un autre moment.",
          ],
          explanation:
            "Le médiateur régule activement la parole. Attendre que l'autre s'exprime spontanément quand il est en position de faiblesse ne fonctionne pas. Une invitation directe et douce est nécessaire.",
        },
        {
          id: "conflicts-3-q3",
          question:
            "Les deux parties ont exprimé leurs besoins. Quelle est la prochaine étape en médiation ?",
          options: [
            "Inviter chaque partie à proposer une ou deux actions concrètes qu'elle est prête à faire.",
            "Formuler vous-même un accord équilibré que les deux doivent signer.",
            "Demander à chaque partie d'évaluer la gravité du conflit sur une échelle de 1 à 10.",
            "Rappeler les règles de l'entreprise sur le respect et la coopération.",
          ],
          explanation:
            "Un accord co-construit est plus durable qu'un accord imposé. Demander à chaque partie ce qu'elle est prête à faire active la responsabilité individuelle.",
        },
        {
          id: "conflicts-3-q4",
          question:
            "Un accord a été trouvé entre les deux collaborateurs. Que faites-vous dans les deux semaines suivantes ?",
          options: [
            "Vous faites un point de suivi avec chacun pour vérifier que l'accord tient dans le quotidien.",
            "Vous considérez que le conflit est résolu et passez à autre chose.",
            "Vous réunissez à nouveau les deux parties pour un bilan collectif immédiat.",
            "Vous envoyez l'accord par écrit à leur N+1 pour information.",
          ],
          explanation:
            "La médiation ne s'arrête pas à l'accord verbal. Un suivi individuel discret permet de détecter rapidement si la situation régresse et d'intervenir avant une rechute.",
        },
        {
          id: "conflicts-3-q5",
          question:
            "Malgré vos efforts de médiation, les deux collaborateurs restent bloqués. Quelle est la bonne décision ?",
          options: [
            "Reconnaître les limites de la médiation et envisager une séparation fonctionnelle ou une escalade RH.",
            "Forcer un accord en rappelant à chacun ses obligations contractuelles.",
            "Tenter une nouvelle session de médiation avec un format différent.",
            "Laisser le temps agir — les conflits se régulent souvent naturellement.",
          ],
          explanation:
            "Certains conflits dépassent le cadre managérial. Savoir passer le relais (RH, coach externe, réorganisation) est une décision de sagesse, pas d'échec.",
        },
      ],
    },
    {
      id: "conflicts-final",
      title: "Examen final Conflits",
      description: "Cas pratique de bout en bout",
      tier: "final",
      passing_score_percent: 80,
      questions: [
        {
          id: "conflicts-f-q1",
          question:
            "Deux membres de votre équipe ne se parlent plus depuis 3 semaines. Personne ne vous en a parlé. Quelle est votre première action ?",
          options: [
            "Faire un 1:1 avec chacun pour comprendre ce qui se passe, sans mentionner l'autre.",
            "Réunir les deux personnes et leur demander de régler le problème devant vous.",
            "Attendre de voir si la situation évolue avant d'intervenir.",
            "En parler à leur RH pour avoir un avis extérieur avant d'agir.",
          ],
          explanation:
            "Le 1:1 individuel est la première étape : il permet d'écouter chaque perspective sans créer de confrontation prématurée. Intervenir directement à deux peut braquer si le conflit est sensible.",
        },
        {
          id: "conflicts-f-q2",
          question:
            "Lors d'un 1:1, un collaborateur vous dit : 'Marie me sabote. Elle retient des informations pour que je rate mes livrables.' Quelle est votre réaction CNV ?",
          options: [
            "Accueillir son ressenti, demander un exemple concret, et rester neutre sur la version de Marie.",
            "Lui dire que vous allez convoquer Marie pour tirer ça au clair.",
            "Lui suggérer d'aller directement voir Marie pour régler ça entre eux.",
            "Lui demander ce qu'il a fait pour provoquer ce comportement.",
          ],
          explanation:
            "Accueillir sans valider l'accusation est la clé. Demander un exemple concret ancre la conversation dans les faits. Prendre parti ou envoyer le collaborateur seul au front aggraverait la situation.",
        },
        {
          id: "conflicts-f-q3",
          question:
            "Vous rencontrez Marie (l'autre partie). Elle est surprise et dit qu'elle n'est au courant d'aucun problème. Que faites-vous ?",
          options: [
            "Lui décrire la situation sans citer son collègue, explorer ce qui a pu se passer de son côté.",
            "Lui révéler que son collègue l'accuse de sabotage pour obtenir sa réaction.",
            "Lui dire que tout va bien et ne rien révéler pour préserver la confiance de l'autre.",
            "Conclure qu'il n'y a pas de conflit réel du côté de Marie et clore le sujet.",
          ],
          explanation:
            "On peut décrire une situation sans citer les sources. L'objectif est de comprendre la réalité de Marie, pas de la mettre en confrontation. La confidentialité des 1:1 est essentielle.",
        },
        {
          id: "conflicts-f-q4",
          question:
            "Lors de la réunion à trois, l'un des collaborateurs dit à l'autre : 'Tu mens.' Comment intervenez-vous ?",
          options: [
            "'Je vous propose de ne pas qualifier les intentions de l'autre, et de nous en tenir à ce que chacun a vécu.'",
            "Vous demandez à l'accusé de répondre pour que tout le monde entende sa version.",
            "Vous sortez les échanges écrits pour arbitrer la vérité.",
            "Vous suspendez la réunion pour laisser les émotions redescendre.",
          ],
          explanation:
            "Recadrer sur les faits et les ressentis, pas sur les intentions prêtées à l'autre, est le rôle central du médiateur. Arbitrer sur la vérité transforme le manager en juge.",
        },
        {
          id: "conflicts-f-q5",
          question:
            "Un accord est trouvé : chacun s'engage à partager les informations critiques via un canal commun. Comment formalisez-vous cet accord ?",
          options: [
            "Vous rédigez un court compte-rendu de l'accord et le partagez aux deux parties pour validation.",
            "Vous gardez l'accord verbal — formaliser peut créer une atmosphère de défiance.",
            "Vous envoyez l'accord à leur RH pour archive.",
            "Vous attendez deux semaines pour voir si l'accord tient avant de le formaliser.",
          ],
          explanation:
            "Formaliser un accord (même brièvement) le rend concret et réduit les malentendus futurs. Le partager pour validation responsabilise les deux parties sans créer un rapport disciplinaire.",
        },
        {
          id: "conflicts-f-q6",
          question:
            "Deux semaines après la médiation, vous observez que les deux collaborateurs collaborent à nouveau. Que faites-vous ?",
          options: [
            "Un court 1:1 avec chacun pour reconnaître le chemin parcouru et vérifier que tout va bien.",
            "Rien — l'accord tient, votre mission est terminée.",
            "Organiser un team building pour consolider la dynamique collective.",
            "Informer la direction que le conflit est résolu.",
          ],
          explanation:
            "Reconnaître le progrès renforce l'engagement et montre que le manager s'investit au-delà du moment de crise. Un bref suivi positif coûte peu et produit beaucoup.",
        },
        {
          id: "conflicts-f-q7",
          question:
            "Lequel de ces facteurs est le plus susceptible de faire échouer une médiation ?",
          options: [
            "Le manager a une relation de proximité personnelle avec l'une des parties.",
            "Les deux parties ont des niveaux hiérarchiques différents.",
            "Le conflit dure depuis moins de deux semaines.",
            "L'une des parties a demandé la médiation de son propre chef.",
          ],
          explanation:
            "Une relation de proximité compromet la neutralité perçue et réelle. Les autres facteurs (hiérarchie, durée courte, initiative personnelle) peuvent être gérés avec les bons outils.",
        },
        {
          id: "conflicts-f-q8",
          question:
            "Quelle est la différence fondamentale entre un conflit de tâche et un conflit relationnel ?",
          options: [
            "Un conflit de tâche porte sur des décisions ou priorités, un conflit relationnel implique des tensions personnelles entre individus.",
            "Un conflit de tâche est moins grave car il est professionnel, le conflit relationnel est toujours plus sérieux.",
            "Un conflit de tâche se résout seul avec le temps, le conflit relationnel nécessite toujours un médiateur.",
            "Un conflit de tâche engage plusieurs personnes, un conflit relationnel n'en engage que deux.",
          ],
          explanation:
            "Les conflits de tâche peuvent stimuler l'innovation s'ils sont bien gérés. Les conflits relationnels détériorent le lien et nécessitent une attention au plan interpersonnel, pas seulement organisationnel.",
        },
      ],
    },
  ],
};
