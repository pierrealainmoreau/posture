import type { AcademiePathway } from "@/lib/types";

export const DELEGATION_PATHWAY: AcademiePathway = {
  id: "delegation",
  title: "La délégation",
  short_description: "Confier sans perdre le fil",
  long_description:
    "Déléguer, ce n'est pas se débarrasser d'une tâche. C'est un acte managérial fort : choisir la bonne personne, cadrer sans micro-manager, faire confiance sans perdre la main. Une compétence au cœur du développement des équipes.",
  icon_name: "HandCoins",
  color_theme: "emerald",
  estimated_minutes: 15,
  is_available: true,
  final_badge: {
    name: "Manager délégant",
    description:
      "Vous savez confier avec clarté, faire confiance avec discernement.",
  },
  quizzes: [
    {
      id: "delegation-1-fondamentaux",
      title: "Pourquoi et quand déléguer",
      description: "Les fondements d'une délégation réussie",
      tier: "bronze",
      passing_score_percent: 80,
      questions: [
        {
          id: "delegation-1-q1",
          question:
            "Votre équipe est surchargée et vous aussi. Quelle est la première question à vous poser avant de déléguer ?",
          options: [
            "Quelle tâche correspond aux compétences et à l'ambition de développement de chacun ?",
            "Qui a le plus de temps disponible en ce moment ?",
            "Comment vais-je contrôler que le travail sera bien fait ?",
            "Est-ce que je peux vraiment faire confiance à quelqu'un d'autre ?",
          ],
          explanation:
            "La délégation est d'abord un outil de développement, pas de décharge de charge. Chercher qui peut grandir sur cette tâche, c'est le premier réflexe d'un manager délégant. Déléguer à la personne 'disponible' conduit souvent à surcharger les bons éléments.",
        },
        {
          id: "delegation-1-q2",
          question:
            "Laquelle de ces tâches est la MOINS appropriée à déléguer, quel que soit votre contexte ?",
          options: [
            "L'entretien annuel d'un collaborateur.",
            "La production du rapport mensuel d'activité.",
            "La veille concurrentielle du secteur.",
            "La coordination avec une autre équipe projet.",
          ],
          explanation:
            "L'entretien annuel est un acte managérial qui engage la relation et la responsabilité directe du manager. Il ne peut pas être délégué. Toutes les autres tâches peuvent être confiées à un collaborateur compétent avec un bon cadrage.",
        },
        {
          id: "delegation-1-q3",
          question:
            "Un collaborateur vous dit 'je veux bien faire ça, mais je ne suis pas sûr d'y arriver'. Que faites-vous ?",
          options: [
            "Vous définissez ensemble les étapes, les ressources disponibles et un point de suivi intermédiaire.",
            "Vous reprenez la tâche vous-même pour éviter le risque.",
            "Vous lui dites que vous avez confiance et que c'est à lui de se débrouiller.",
            "Vous déléguez à quelqu'un de plus expérimenté à la place.",
          ],
          explanation:
            "Le doute exprimé est une demande de soutien, pas un refus. Un bon manager délégant co-construit un plan d'action rassurant : jalons clairs, ressources identifiées, filet de sécurité. Cela renforce la confiance sans créer de dépendance.",
        },
        {
          id: "delegation-1-q4",
          question:
            "Quelle est la principale raison pour laquelle les managers ne délèguent pas assez, selon la plupart des études sur le sujet ?",
          options: [
            "Ils craignent de perdre leur utilité ou leur contrôle.",
            "Leurs collaborateurs ne sont pas assez compétents.",
            "Les tâches sont trop complexes à expliquer.",
            "Ils manquent de temps pour former les gens.",
          ],
          explanation:
            "La peur de perdre le contrôle — ou d'être perçu comme 'moins utile' — est le frein numéro un. Le paradoxe : en ne déléguant pas, le manager crée un goulot d'étranglement qui réduit réellement son impact. Déléguer, c'est multiplier sa capacité d'action.",
        },
        {
          id: "delegation-1-q5",
          question:
            "Vous déléguez une mission à Marie. Quelle formulation de cadrage est la plus efficace ?",
          options: [
            "\"Je te confie le rapport projet X : l'objectif est d'avoir une synthèse de 2 pages pour le comité vendredi 9h. Tu as accès aux données dans le Drive. On fait un point jeudi si tu as besoin.\"",
            "\"Fais-moi un beau rapport sur le projet X pour vendredi.\"",
            "\"Tu t'en sors comment ? Si tu as besoin je suis là.\"",
            "\"Regarde comment j'ai fait le dernier rapport et reproduis le même format.\"",
          ],
          explanation:
            "Une bonne délégation contient : la mission (quoi), le livrable attendu (format/critères de succès), l'échéance précise, les ressources disponibles, et un point de contact prévu. Sans ces éléments, la délégation génère de l'anxiété et des allers-retours coûteux.",
        },
      ],
    },
    {
      id: "delegation-2-confiance",
      title: "Faire confiance sans disparaître",
      description: "Suivi, autonomie et lâcher-prise",
      tier: "silver",
      passing_score_percent: 80,
      questions: [
        {
          id: "delegation-2-q1",
          question:
            "Vous avez délégué une tâche à Paul. Deux jours après, vous avez une envie forte de vérifier où il en est, même si aucun jalon n'était prévu. Que faites-vous ?",
          options: [
            "Vous résistez à l'envie : vous avez confiance, aucun point n'était prévu.",
            "Vous allez voir Paul pour lui demander comment ça avance.",
            "Vous interrogez un collègue de Paul pour avoir un retour indirect.",
            "Vous reprenez discrètement une partie de la tâche en parallèle.",
          ],
          explanation:
            "Intervenir sans raison objective, c'est du micro-management déguisé. Si aucun signal d'alerte n'est présent, respecter l'espace d'autonomie est la bonne posture. Si l'envie de vérifier est forte, c'est peut-être que le cadrage initial n'était pas assez solide.",
        },
        {
          id: "delegation-2-q2",
          question:
            "Paul revient avec un livrable qui n'est pas parfait mais qui répond à l'objectif fixé. Il a fait différemment de vous. Comment réagissez-vous ?",
          options: [
            "Vous validez le livrable, relevez ce qui fonctionne bien, et partagez un feedback ciblé si nécessaire.",
            "Vous refaites vous-même les parties qui ne correspondent pas à votre méthode.",
            "Vous lui expliquez point par point ce que vous auriez fait différemment.",
            "Vous lui dites que c'est bien mais vous refaites en silence.",
          ],
          explanation:
            "Déléguer implique d'accepter que les choses soient faites autrement. Si l'objectif est atteint, le 'comment' appartient au collaborateur. Le refaire en silence tue la confiance. Un feedback ciblé (et non exhaustif) permet de progresser sans dévaloriser.",
        },
        {
          id: "delegation-2-q3",
          question:
            "Quelle est la différence entre un suivi et du micro-management ?",
          options: [
            "B et C sont toutes les deux vraies.",
            "Le suivi est fait en réunion, le micro-management en tête à tête.",
            "Le suivi est défini en amont dans le cadrage, le micro-management est imposé unilatéralement en cours de route.",
            "Le suivi porte sur les résultats, le micro-management sur les méthodes.",
          ],
          explanation:
            "Un bon suivi est co-construit et prévisible : il a été annoncé dans le cadrage. Le micro-management, lui, s'impose sans logique claire et souvent sur la méthode, pas le résultat. Les deux dimensions (timing prévu + focus résultat) définissent la ligne de partage.",
        },
        {
          id: "delegation-2-q4",
          question:
            "Un collaborateur à qui vous avez délégué une mission revient vous voir à chaque petite décision. Quelle est la cause la plus probable ?",
          options: [
            "Le cadrage initial n'était pas assez clair sur le périmètre de décision.",
            "Il manque de compétences sur ce sujet.",
            "Il manque confiance en lui et c'est son problème.",
            "Vous ne l'avez pas assez formé avant de déléguer.",
          ],
          explanation:
            "Quand un collaborateur revient sans cesse, c'est presque toujours que le cadrage laisse des zones grises. Qui décide quoi ? Jusqu'où peut-il aller sans vous consulter ? Clarifier le périmètre d'autonomie en amont évite 80% des allers-retours.",
        },
        {
          id: "delegation-2-q5",
          question:
            "Vous réalisez que votre collaborateur est en train de rater une étape importante. Quelle est la bonne posture ?",
          options: [
            "Vous lui posez des questions ouvertes pour qu'il identifie lui-même le problème, en lui laissant la main.",
            "Vous intervenez immédiatement pour corriger, sans attendre.",
            "Vous attendez qu'il échoue pour lui expliquer ensuite.",
            "Vous prenez la tâche en charge pour sauver la situation.",
          ],
          explanation:
            "L'erreur en cours est une opportunité d'apprentissage si elle est attrapée à temps. Intervenir directement infantilise. Attendre l'échec est inutilement cruel. Questionner permet au collaborateur de voir lui-même le problème et de corriger : c'est la posture coach appliquée à la délégation.",
        },
      ],
    },
    {
      id: "delegation-3-montee-competences",
      title: "Déléguer pour faire grandir",
      description: "La délégation comme levier de développement",
      tier: "gold",
      passing_score_percent: 80,
      questions: [
        {
          id: "delegation-3-q1",
          question:
            "Selon le modèle de délégation situationnelle, quel est le style adapté à un collaborateur compétent mais peu motivé sur une tâche ?",
          options: [
            "Soutien et participation : vous l'impliquez dans le sens et les décisions.",
            "Directive forte : vous précisez chaque étape.",
            "Délégation totale : il sait faire, laissez-le faire.",
            "Formation intensive avant de lui confier la tâche.",
          ],
          explanation:
            "Quand la compétence est là mais la motivation manque, le levier n'est pas le 'comment faire' (qu'il maîtrise) mais le 'pourquoi ça compte'. L'impliquer dans les choix, nommer l'impact de sa contribution, lui donner de la visibilité : ce sont les leviers du soutien participatif.",
        },
        {
          id: "delegation-3-q2",
          question:
            "Vous souhaitez déléguer une mission stratégique à Sophie pour la faire progresser. Elle est compétente mais n'a jamais eu ce niveau de responsabilité. Comment procédez-vous ?",
          options: [
            "Vous découpez la mission en paliers progressifs, avec des points de soutien planifiés.",
            "Vous lui donnez la mission complète sans filet pour qu'elle prouve sa valeur.",
            "Vous lui assignez un binôme senior pour qu'elle ne soit jamais seule.",
            "Vous attendez qu'elle demande plus de responsabilités d'elle-même.",
          ],
          explanation:
            "La délégation développante procède par paliers : chaque étape réussie renforce la confiance et prépare la suivante. Un filet de sécurité ne signifie pas tenir la main — cela signifie qu'il existe des points de contact clairs si besoin. Cela réduit l'anxiété sans nuire à l'autonomie.",
        },
        {
          id: "delegation-3-q3",
          question:
            "Quel est le risque principal de toujours déléguer les mêmes tâches aux mêmes personnes ?",
          options: [
            "Toutes ces réponses sont des risques réels.",
            "Ces personnes deviennent trop indispensables et difficiles à remplacer.",
            "Le reste de l'équipe se sent mis à l'écart et ne se développe pas.",
            "La qualité baisse car ils se lassent de ces tâches.",
          ],
          explanation:
            "Les trois risques coexistent. La délégation répétée aux mêmes crée des 'super-délégués' qui deviennent des goulets, des 'invisibles' qui stagnent, et des lassitudes chez les sur-sollicités. Un bon manager varie les délégations pour développer l'ensemble de l'équipe.",
        },
        {
          id: "delegation-3-q4",
          question:
            "Après une délégation réussie, quelle est l'étape souvent négligée par les managers ?",
          options: [
            "Prendre le temps de faire un débrief avec le collaborateur sur ce qu'il a appris.",
            "Vérifier que le livrable correspond bien à l'objectif.",
            "Informer la hiérarchie du bon travail réalisé.",
            "Documenter la méthode utilisée pour la reproduire.",
          ],
          explanation:
            "Le débrief de fin de délégation est la boucle d'apprentissage souvent oubliée. 'Qu'est-ce que tu as appris ? Qu'est-ce que tu ferais différemment ? Comment te sens-tu par rapport à ce type de mission ?' Ces questions transforment une tâche réussie en compétence ancrée.",
        },
        {
          id: "delegation-3-q5",
          question:
            "Un collaborateur à qui vous déléguez régulièrement dit : 'J'ai l'impression de faire votre travail sans en avoir le titre ni le salaire.' Quelle est la bonne réponse ?",
          options: [
            "Vous reconnaissez sa contribution, clarifiez ce que ça ouvre comme perspective, et escaladez si la question de reconnaissance dépasse votre périmètre.",
            "Vous lui expliquez que c'est de la formation et qu'il devrait être reconnaissant.",
            "Vous arrêtez de lui déléguer pour éviter le conflit.",
            "Vous lui dites que tout le monde passe par là et que c'est normal.",
          ],
          explanation:
            "Cette réaction est légitime et fréquente. Elle signale que la délégation n'a pas été assez expliquée dans sa dimension de développement, et que la reconnaissance n'a pas suivi. La bonne réponse : nommer la valeur de sa contribution, indiquer ce que ça prépare, et agir sur les leviers de reconnaissance disponibles.",
        },
      ],
    },
    {
      id: "delegation-final",
      title: "Examen final — Délégation",
      description: "Mise en situation de bout en bout",
      tier: "final",
      passing_score_percent: 80,
      questions: [
        {
          id: "delegation-final-q1",
          question:
            "Quelle est la distinction essentielle entre 'confier une tâche' et 'déléguer' ?",
          options: [
            "La délégation transfère une responsabilité et une autorité, pas juste une tâche à exécuter.",
            "La délégation concerne uniquement les missions longues.",
            "Confier une tâche implique plus de suivi que déléguer.",
            "Il n'y a pas de différence réelle.",
          ],
          explanation:
            "Confier une tâche, c'est demander une exécution. Déléguer, c'est transférer une responsabilité : le collaborateur prend des décisions, rend compte d'un résultat, et porte la mission. Cette nuance est fondamentale — sans elle, on obtient des exécutants, pas des collaborateurs qui grandissent.",
        },
        {
          id: "delegation-final-q2",
          question:
            "Vous êtes débordé et vous choisissez de déléguer la coordination du prochain séminaire d'équipe à Léa. Elle est organisée mais n'a jamais fait ça. Quel est votre premier geste ?",
          options: [
            "Faire un point en tête à tête pour lui expliquer le contexte, les enjeux, le périmètre et ce que vous attendez comme résultat.",
            "Lui envoyer un email avec la liste de tout ce qu'il faut faire.",
            "La mettre directement en copie des emails du prestataire.",
            "Lui partager le dossier de l'année dernière sans plus d'explication.",
          ],
          explanation:
            "La réunion de cadrage est le fondement de toute délégation réussie. Contexte, enjeux, critères de succès, périmètre d'autonomie, ressources disponibles, points de contact : ces éléments doivent être donnés en direct, pas dans un email ou un fichier à déchiffrer seule.",
        },
        {
          id: "delegation-final-q3",
          question:
            "Quel comportement illustre le mieux le 'micro-management déguisé' ?",
          options: [
            "Retravailler systématiquement les livrables des collaborateurs 'pour les améliorer' sans leur en parler.",
            "Faire un point hebdomadaire sur les avancées d'un projet.",
            "Demander un rapport mensuel sur les résultats.",
            "Fixer des objectifs clairs au début d'un projet.",
          ],
          explanation:
            "Retravailler en silence les livrables est une forme insidieuse de micro-management : le collaborateur pense avoir bien fait, ne reçoit pas de feedback, et ne comprend pas pourquoi sa version n'est jamais la version finale. C'est destructeur pour la confiance et l'apprentissage.",
        },
        {
          id: "delegation-final-q4",
          question:
            "Votre collaborateur revient vous voir avec une décision à prendre qui entre dans son périmètre de délégation. Comment réagissez-vous ?",
          options: [
            "Vous lui renvoyez la question : 'Toi, qu'est-ce que tu ferais ?'",
            "Vous prenez la décision pour lui, c'est plus rapide.",
            "Vous lui dites que c'est son job et que vous n'avez pas le temps.",
            "Vous lui dites de prendre la décision qui lui semble juste et d'en assumer les conséquences.",
          ],
          explanation:
            "Renvoyer la question avec bienveillance force le collaborateur à mobiliser son propre jugement, ce qui développe son autonomie. Décider à sa place crée de la dépendance. Lui dire 'c'est votre job' sans soutien est brutal. 'Qu'est-ce que tu ferais ?' est la question clé de la posture coach-manager.",
        },
        {
          id: "delegation-final-q5",
          question:
            "Vous déléguez une mission à un collaborateur junior très motivé mais peu expérimenté. Quel niveau de contrôle adoptez-vous ?",
          options: [
            "Contrôle ciblé sur les résultats intermédiaires, avec disponibilité affichée.",
            "Contrôle minimal : la motivation compense l'inexpérience.",
            "Contrôle élevé avec des points fréquents sur les méthodes ET les résultats.",
            "Aucun contrôle : il faut lui faire confiance dès le départ.",
          ],
          explanation:
            "Motivation élevée + compétence faible = besoin de direction et de soutien simultanés. Des jalons sur les livrables (pas les méthodes) permettent de corriger la trajectoire sans étouffer l'enthousiasme. La disponibilité affichée est un filet de sécurité psychologique important pour les juniors.",
        },
        {
          id: "delegation-final-q6",
          question:
            "Quelle est la bonne posture face à un collaborateur qui réalise une tâche déléguée d'une façon très différente de la vôtre, mais avec un bon résultat ?",
          options: [
            "Valider le résultat et s'interroger soi-même sur ce que sa méthode vous apprend.",
            "Lui montrer votre méthode pour qu'il s'améliore.",
            "Lui expliquer que pour la prochaine fois, il devra s'aligner sur votre façon de faire.",
            "Ne rien dire pour ne pas le décourager.",
          ],
          explanation:
            "Quand le résultat est atteint, la méthode appartient au collaborateur. S'interroger sur ce que sa façon de faire vous apprend — c'est la marque d'un manager mature. Imposer votre méthode sur un bon résultat, c'est envoyer le message que l'autonomie n'est qu'illusoire.",
        },
        {
          id: "delegation-final-q7",
          question:
            "Un collaborateur échoue sur une mission que vous lui avez déléguée. Quelle est votre part de responsabilité à examiner en premier ?",
          options: [
            "Toutes ces questions sont pertinentes.",
            "Avez-vous choisi la bonne personne pour cette mission ?",
            "Le cadrage était-il suffisamment clair et complet ?",
            "Avez-vous été suffisamment disponible pour les questions ?",
          ],
          explanation:
            "Un échec sur une délégation est rarement la seule faute du collaborateur. Choix de personne inadapté, cadrage flou, absence de soutien disponible : chacun de ces facteurs peut contribuer à l'échec. Le réflexe du manager est de faire d'abord sa propre revue avant de tirer des conclusions.",
        },
        {
          id: "delegation-final-q8",
          question:
            "Quelle formulation illustre le mieux l'esprit d'une délégation développante ?",
          options: [
            "\"Je te confie cette mission parce que je pense que tu es prêt à ce niveau de responsabilité, et parce qu'elle va te permettre de développer ta capacité à...'\"",
            "\"Je te confie ça parce que j'ai trop de travail.\"",
            "\"Tu as deux semaines, tu me tiens au courant.\"",
            "\"Fais de ton mieux, je fais confiance à ton jugement.\"",
          ],
          explanation:
            "Une délégation développante nomme explicitement le pourquoi (confiance dans la personne), le quoi (la mission), et la dimension de croissance attendue. Elle lie la tâche à la trajectoire du collaborateur — ce qui transforme une mission en investissement dans sa progression.",
        },
      ],
    },
  ],
};
