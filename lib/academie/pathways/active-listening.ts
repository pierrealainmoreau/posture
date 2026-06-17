import type { AcademiePathway } from "@/lib/types";

export const ACTIVE_LISTENING_PATHWAY: AcademiePathway = {
  id: "active-listening",
  title: "Écoute active",
  short_description: "Vraiment entendre, pas juste écouter",
  long_description:
    "L'écoute active selon Carl Rogers : reformulation, validation, suspension du jugement. La compétence qui change radicalement la qualité des 1:1.",
  icon_name: "Ear",
  color_theme: "purple",
  estimated_minutes: 15,
  is_available: true,
  final_badge: {
    name: "Écoutant actif",
    description: "Vous savez créer un espace où l'autre se sent entendu.",
  },
  quizzes: [
    {
      id: "active-listening-1-fondamentaux",
      title: "Les fondamentaux",
      description: "Présence, silence, attention",
      tier: "bronze",
      passing_score_percent: 80,
      questions: [
        {
          id: "al-1-q1",
          question:
            "Votre collaborateur commence à vous parler d'un problème délicat. Quelle posture d'écoute active adoptez-vous en priorité ?",
          options: [
            "Poser votre stylo, vous tourner vers lui et maintenir un contact visuel bienveillant.",
            "Prendre des notes pour ne rien oublier et lui montrer que vous l'écoutez sérieusement.",
            "Hocher régulièrement la tête pour lui signifier votre accord.",
            "Chercher rapidement des solutions à lui proposer afin de l'aider efficacement.",
          ],
          explanation:
            "L'écoute active commence par la présence physique : poser ce qu'on fait, se tourner vers l'autre, le regarder. La prise de notes peut parasiter le lien. Acquiescer ne signifie pas écouter. Chercher des solutions trop vite coupe l'expression.",
        },
        {
          id: "al-1-q2",
          question:
            "Un collaborateur marque une longue pause au milieu de son explication. Que faites-vous ?",
          options: [
            "Vous attendez en silence, en laissant la place à ce qui veut émerger.",
            "Vous terminez sa phrase pour lui montrer que vous avez compris.",
            "Vous posez une question pour relancer la conversation et éviter le malaise.",
            "Vous rassurez : 'Prends le temps, pas de presse.'",
          ],
          explanation:
            "Le silence est un outil puissant en écoute active. Il donne de l'espace pour que l'autre accède à des pensées plus profondes. Finir les phrases ou relancer trop vite ferme cet espace.",
        },
        {
          id: "al-1-q3",
          question:
            "Quel est le principal obstacle à une écoute vraiment active lors d'un 1:1 ?",
          options: [
            "Préparer mentalement sa réponse pendant que l'autre parle.",
            "Maintenir un contact visuel trop soutenu.",
            "Poser trop peu de questions.",
            "Ne pas prendre de notes.",
          ],
          explanation:
            "Écouter en préparant sa réponse est la forme d'inattention la plus répandue. On entend les mots mais on ne perçoit plus le sens ni l'émotion. Le remède : écouter pour comprendre, pas pour répondre.",
        },
        {
          id: "al-1-q4",
          question:
            "Qu'est-ce que la 'présence totale' en écoute active ?",
          options: [
            "Suspendre ses propres pensées et jugements pour se centrer entièrement sur ce que l'autre exprime.",
            "Être physiquement dans la même pièce que l'autre sans interruption extérieure.",
            "Garder le silence tout au long de l'échange pour ne pas influencer l'autre.",
            "Prendre des notes exhaustives pour restituer fidèlement ce qui a été dit.",
          ],
          explanation:
            "La présence totale est intérieure, pas seulement physique. Elle implique de mettre en veille ses propres filtres, opinions et préoccupations pour laisser entrer pleinement la réalité de l'autre.",
        },
        {
          id: "al-1-q5",
          question:
            "Un collaborateur vous parle d'une situation personnelle difficile. Votre téléphone vibre deux fois. Que faites-vous ?",
          options: [
            "Vous ignorez le téléphone et restez pleinement présent à la conversation.",
            "Vous regardez rapidement l'écran pour vérifier si c'est urgent, puis revenez à la conversation.",
            "Vous vous excusez et coupez le son avant de continuer.",
            "Vous demandez à votre collaborateur si ça le dérange que vous jetiez un œil.",
          ],
          explanation:
            "Regarder son téléphone, même furtivement, rompt le lien et signale que l'autre n'est pas la priorité. Dans une conversation sensible, l'idéal est de mettre le téléphone face cachée ou hors de portée avant de commencer.",
        },
      ],
    },
    {
      id: "active-listening-2-reformulation",
      title: "L'art de la reformulation",
      description: "Renvoyer en miroir, sans interpréter",
      tier: "silver",
      passing_score_percent: 80,
      questions: [
        {
          id: "al-2-q1",
          question:
            "Un collaborateur dit : 'Je n'en peux plus de cette réorganisation, personne ne sait où on va.' Quelle reformulation est la plus juste ?",
          options: [
            "'Si je comprends bien, tu te sens épuisé et tu as besoin de plus de clarté sur la direction ?'",
            "'Tu es démotivé, c'est normal vu la situation.'",
            "'Je comprends, moi aussi je trouve que cette réorganisation est mal gérée.'",
            "'Il faut tenir bon, ça va se stabiliser.'",
          ],
          explanation:
            "La bonne reformulation reprend les mots clés ('épuisé', 'clarté') sans ajouter de jugement ni de solution. Elle termine souvent par une question de vérification. Les autres réponses interprètent, valident ou minimisent.",
        },
        {
          id: "al-2-q2",
          question:
            "Quelle est la différence entre la reformulation écho et la reformulation reflet ?",
          options: [
            "L'écho reprend presque mot pour mot ce qu'a dit l'autre ; le reflet reformule le sens ou l'émotion avec ses propres mots.",
            "L'écho est utilisé pour les faits, le reflet pour les émotions.",
            "L'écho est une technique avancée, le reflet est pour les débutants.",
            "Il n'y a pas de différence : ce sont deux noms pour la même technique.",
          ],
          explanation:
            "L'écho ('tu m'as dit que...') montre qu'on a bien entendu les mots. Le reflet ('ce que j'entends, c'est que tu te sens...') va plus loin en capturant le sens ou l'émotion sous-jacente.",
        },
        {
          id: "al-2-q3",
          question:
            "Votre collaborateur vient de parler pendant 3 minutes d'une situation complexe. Quelle est la meilleure façon de reformuler ?",
          options: [
            "Résumer les deux ou trois points clés que vous avez retenus et vérifier avec lui que c'est juste.",
            "Répéter mot pour mot ce qu'il vient de dire pour lui montrer que vous avez tout retenu.",
            "Poser une question ouverte sur l'aspect qui vous a le plus interpellé.",
            "Partager votre propre analyse de la situation avant de lui demander si vous avez bien compris.",
          ],
          explanation:
            "Une bonne reformulation synthétise sans reformuler exhaustivement. Elle identifie l'essentiel et se vérifie. Répéter mot pour mot est mécanique ; partager son analyse avant la vérification risque de court-circuiter l'autre.",
        },
        {
          id: "al-2-q4",
          question:
            "Laquelle de ces formulations constitue une reformulation clarifiante ?",
          options: [
            "'Quand tu parles de «manque de reconnaissance», tu veux dire par rapport à ton manager ou à l’ensemble de l’équipe ?'",
            "'Donc tu n'es pas reconnu à ta juste valeur.'",
            "'Je comprends ce que tu ressens, moi aussi j'ai vécu ça.'",
            "'Est-ce que tu veux qu'on cherche des solutions ensemble ?'",
          ],
          explanation:
            "La reformulation clarifiante demande à l'autre de préciser un point ambigu, sans interprétation. Elle aide à éviter les malentendus. Les autres réponses affirmissent, s'approprient ou orientent trop vite vers l'action.",
        },
        {
          id: "al-2-q5",
          question:
            "À quel moment la reformulation est-elle particulièrement utile dans un 1:1 ?",
          options: [
            "Quand le collaborateur vient de partager quelque chose de chargé émotionnellement, avant de passer à la suite.",
            "À la fin de chaque phrase, pour montrer qu'on suit.",
            "Uniquement quand on n'a pas compris ce que l'autre a dit.",
            "Quand on veut gagner du temps avant de répondre.",
          ],
          explanation:
            "La reformulation est particulièrement puissante après un moment fort — elle signale que l'autre a été vraiment entendu et crée un espace sécurisant avant d'aller plus loin. Trop fréquente, elle devient mécanique et perd son effet.",
        },
      ],
    },
    {
      id: "active-listening-3-pieges",
      title: "Les pièges classiques",
      description: "Les réflexes à désamorcer",
      tier: "gold",
      passing_score_percent: 80,
      questions: [
        {
          id: "al-3-q1",
          question:
            "Un collaborateur vous dit qu'il est stressé par une présentation importante demain. Votre réflexe est de lui dire : 'J'ai eu la même chose l'année dernière, voilà comment j'ai géré.' Quel est le problème ?",
          options: [
            "Vous ramenez la conversation à vous, ce qui détourne l'attention du besoin de votre collaborateur.",
            "Vous lui proposez une solution trop rapidement sans explorer le problème.",
            "Vous minimisez son stress en lui montrant que d'autres ont vécu la même chose.",
            "Votre exemple n'est peut-être pas pertinent pour sa situation spécifique.",
          ],
          explanation:
            "Le 'moi aussi' est un piège d'écoute classique : on croit créer du lien, mais on capte l'attention sur soi. L'autre se retrouve en position d'écouter, alors qu'il avait besoin d'être entendu.",
        },
        {
          id: "al-3-q2",
          question:
            "Un collaborateur vous parle d'un désaccord avec un autre collègue. Avant même qu'il ait fini, vous lui proposez trois pistes d'action. Quel est l'écueil ?",
          options: [
            "Le conseil prématuré coupe l'expression : l'autre n'a pas eu le temps d'explorer lui-même le problème.",
            "Vos solutions risquent d'être inadaptées car vous ne connaissez pas les deux versions.",
            "Proposer des pistes d'action est un rôle de coach, pas de manager.",
            "Vous créez une dépendance si vous résolvez les problèmes à sa place.",
          ],
          explanation:
            "Le conseil prématuré est la tentation la plus forte du manager. En intervenant avant que l'autre ait fini, on lui retire la possibilité de trouver lui-même une issue — et on passe souvent à côté du vrai problème.",
        },
        {
          id: "al-3-q3",
          question:
            "Votre collaborateur vous dit qu'il pense que le projet prend une mauvaise direction. Vous répondez : 'Je t'arrête, cette direction a été validée par la direction, donc elle est correcte.' Quel piège commettez-vous ?",
          options: [
            "Le jugement déguisé en autorité : vous fermez la conversation avant d'avoir compris son point de vue.",
            "Vous manquez de transparence en ne partageant pas les raisons de la décision.",
            "Vous ne lui donnez pas la possibilité de proposer des alternatives.",
            "Vous montrez que vous n'êtes pas à l'aise avec la contradiction.",
          ],
          explanation:
            "Couper l'expression au nom d'une autorité extérieure est un piège d'écoute : on n'a pas cherché à comprendre le raisonnement de l'autre. L'écoute active exige d'entendre même ce qui dérange.",
        },
        {
          id: "al-3-q4",
          question:
            "Lequel de ces comportements est le piège le plus fréquent lors d'un 1:1 managérial ?",
          options: [
            "Passer trop vite en mode 'résolution de problèmes' avant d'avoir vraiment compris la situation.",
            "Poser trop de questions ouvertes qui mettent le collaborateur mal à l'aise.",
            "Trop reformuler, ce qui peut sembler condescendant.",
            "Prendre des notes pendant que l'autre parle.",
          ],
          explanation:
            "Le mode 'résolution de problèmes' est confortable pour le manager mais souvent prématuré. Comprendre vraiment avant d'agir est la discipline centrale de l'écoute active.",
        },
        {
          id: "al-3-q5",
          question:
            "Un collaborateur vous dit qu'il envisage de quitter l'équipe. Votre première réaction devrait être :",
          options: [
            "Explorer ce qui l'amène à cette réflexion avant de dire quoi que ce soit d'autre.",
            "Lui dire que vous comprenez et lui demander ce qu'il faudrait pour qu'il reste.",
            "Lui partager à quel point son départ serait une perte pour l'équipe.",
            "Lui demander s'il a déjà un autre poste en vue.",
          ],
          explanation:
            "Face à une annonce chargée, l'écoute active invite d'abord à comprendre sans orienter ni défendre. Aller directement à la rétention ou aux détails pratiques court-circuite l'exploration du fond.",
        },
      ],
    },
    {
      id: "active-listening-final",
      title: "Examen final Écoute",
      description: "Mise en pratique en situation managériale",
      tier: "final",
      passing_score_percent: 80,
      questions: [
        {
          id: "al-f-q1",
          question:
            "Lors d'un 1:1, votre collaborateur dit : 'Je fais des heures folles et personne ne s'en rend compte.' Quelle est la meilleure réponse initiale ?",
          options: [
            "'Si je comprends bien, tu te sens épuisé et pas reconnu pour l'effort que tu fournis ?'",
            "'Je vais regarder ta charge et voir ce qu'on peut alléger.'",
            "'Tu aurais dû m'en parler plus tôt, on aurait pu ajuster.'",
            "'Tout le monde est sous pression en ce moment, tu n'es pas le seul.'",
          ],
          explanation:
            "La reformulation empathique est la première étape : elle valide le ressenti avant toute action ou explication. Proposer des solutions ou minimiser ferme l'espace d'expression.",
        },
        {
          id: "al-f-q2",
          question:
            "Après la reformulation, votre collaborateur ajoute : 'En fait, ce qui me pèse surtout, c'est que mon travail n'est jamais mentionné dans les réunions de direction.' Quelle question posez-vous ensuite ?",
          options: [
            "'Qu'est-ce que ça représenterait pour toi d'être mentionné dans ces réunions ?'",
            "'Qui prend en général la parole dans ces réunions à ta place ?'",
            "'Qu'est-ce que tu attends de moi concrètement sur ce point ?'",
            "'Tu veux que je te représente mieux, c'est ça ?'",
          ],
          explanation:
            "Explorer le besoin derrière la demande (reconnaissance, visibilité, légitimité ?) permet de construire une réponse qui touchera vraiment. Aller directement à la solution ou au 'qui fait quoi' saute cette étape essentielle.",
        },
        {
          id: "al-f-q3",
          question:
            "Votre collaborateur marque un long silence après votre question. Que faites-vous ?",
          options: [
            "Vous attendez, en maintenant une présence bienveillante.",
            "Vous relancez avec une question différente pour l'aider.",
            "Vous proposez une réponse possible pour briser la glace.",
            "Vous dites : 'Prends le temps, il n'y a pas d'urgence.'",
          ],
          explanation:
            "Le silence est souvent le signe que l'autre accède à quelque chose d'important. L'attendre avec calme est la forme d'écoute la plus puissante. Briser le silence trop vite ferme cet accès.",
        },
        {
          id: "al-f-q4",
          question:
            "Votre collaborateur dit : 'De toute façon, ça ne changera rien.' Quel piège devez-vous éviter ici ?",
          options: [
            "Le réfuter trop vite en listant toutes les raisons pour lesquelles les choses peuvent changer.",
            "Lui demander pourquoi il pense ça.",
            "Accueillir son découragement sans le nier.",
            "Lui rappeler les actions concrètes déjà prises.",
          ],
          explanation:
            "Réfuter une croyance de découragement avec de la logique crée souvent un effet inverse. L'écoute active invite à accueillir le ressenti d'abord ('tu sembles vraiment découragé'), avant d'explorer les faits.",
        },
        {
          id: "al-f-q5",
          question:
            "En fin de 1:1, votre collaborateur semble soulagé d'avoir parlé. Quelle est la meilleure façon de clore l'échange ?",
          options: [
            "Résumer ce que vous avez entendu, lui demander ce qu'il retient et convenir d'une prochaine étape si nécessaire.",
            "Lui proposer de noter tout ce qu'il vient de dire dans un email de synthèse.",
            "Lui rappeler que votre porte est toujours ouverte s'il a besoin.",
            "Lui demander si vous pouvez partager ce qu'il vient de dire avec son N+2.",
          ],
          explanation:
            "Une clôture bien faite récapitule, vérifie et ouvre sur une action concrète si pertinente. Elle ancre la conversation et renforce la confiance. 'Ma porte est ouverte' est trop vague pour créer un effet.",
        },
        {
          id: "al-f-q6",
          question:
            "Quelle est la principale différence entre entendre et écouter activement ?",
          options: [
            "Entendre est un processus passif et physique ; écouter activement est une démarche intentionnelle d'attention et de compréhension.",
            "Entendre est suffisant pour les sujets simples ; l'écoute active est réservée aux situations complexes.",
            "L'écoute active nécessite de prendre des notes ; entendre non.",
            "Entendre, c'est recevoir les mots ; écouter activement, c'est proposer des solutions.",
          ],
          explanation:
            "L'écoute active est une posture délibérée : on choisit de suspendre ses filtres et d'être entièrement tourné vers l'autre. Entendre peut se faire en pensant à autre chose — pas l'écoute active.",
        },
        {
          id: "al-f-q7",
          question:
            "Un collaborateur exprime un problème que vous avez vous-même connu. Quelle est la meilleure façon d'utiliser votre expérience personnelle ?",
          options: [
            "L'évoquer brièvement si cela peut créer de l'empathie, puis recentrer la conversation sur son vécu.",
            "La partager en détail pour lui montrer que vous comprenez vraiment ce qu'il traverse.",
            "Ne pas l'évoquer — vos expériences ne sont pas pertinentes pour aider l'autre.",
            "La partager uniquement si l'autre vous le demande explicitement.",
          ],
          explanation:
            "Une référence courte à son propre vécu peut créer de la proximité, à condition de ne pas accaparer la conversation. Le risque du 'moi aussi' est de basculer d'une écoute de l'autre à un témoignage sur soi.",
        },
        {
          id: "al-f-q8",
          question:
            "Lequel de ces indicateurs montre qu'un 1:1 a été conduit avec une écoute vraiment active ?",
          options: [
            "Le collaborateur dit en partant : 'C'est bien d'avoir pu en parler, je vois plus clairement.'",
            "Le manager a pris deux pages de notes pendant la conversation.",
            "Le manager a apporté des solutions concrètes à chaque problème évoqué.",
            "La conversation a duré exactement le temps prévu.",
          ],
          explanation:
            "Le signe le plus fiable d'une bonne écoute active est le ressenti du collaborateur : se sentir entendu, avoir gagné en clarté. Ce n'est pas la quantité de notes ni de solutions qui mesure la qualité de l'écoute.",
        },
      ],
    },
  ],
};
