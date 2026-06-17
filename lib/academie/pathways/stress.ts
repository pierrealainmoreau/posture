import type { AcademiePathway } from "@/lib/types";

export const STRESS_PATHWAY: AcademiePathway = {
  id: "stress",
  title: "Gestion du stress et de la charge",
  short_description: "Prévenir l'épuisement, poser des limites",
  long_description:
    "Le manager est à la fois potentiellement source de stress et première ligne de prévention pour son équipe. Reconnaître les signaux faibles, réguler sa propre charge, tenir ses limites : des compétences vitales dans les environnements sous pression.",
  icon_name: "Activity",
  color_theme: "rose",
  estimated_minutes: 15,
  is_available: true,
  final_badge: {
    name: "Manager protecteur",
    description:
      "Vous savez détecter, prévenir et gérer la surcharge dans votre équipe.",
  },
  quizzes: [
    {
      id: "stress-1-signaux",
      title: "Reconnaître les signaux d'alerte",
      description: "Voir l'épuisement avant qu'il n'explose",
      tier: "bronze",
      passing_score_percent: 80,
      questions: [
        {
          id: "stress-1-q1",
          question:
            "Lequel de ces signes est le plus révélateur d'un collaborateur en début de burn-out ?",
          options: [
            "Il devient cynique, s'isole et son efficacité baisse malgré un investissement apparent toujours fort.",
            "Il prend plus de pauses que d'habitude.",
            "Il exprime ouvertement qu'il est débordé.",
            "Il demande plus souvent de l'aide à ses collègues.",
          ],
          explanation:
            "Le début du burn-out est paradoxalement peu visible car la personne continue souvent à 'forcer'. Les signes précoces sont plus subtils : cynisme croissant, retrait social, perte d'efficacité sans réduction d'effort apparent, et souvent une fierté à ne pas 'craquer'. L'expression ouverte de la surcharge, à l'inverse, est souvent un bon signe — la personne fait encore confiance.",
        },
        {
          id: "stress-1-q2",
          question:
            "Un collaborateur habituellement ponctuel accumule les absences courtes depuis quelques semaines. Que pensez-vous en premier ?",
          options: [
            "C'est un signal potentiel de difficulté — santé, stress, surcharge — qui mérite une conversation.",
            "Il profite peut-être de la situation.",
            "C'est son problème personnel, vous n'avez pas à intervenir.",
            "Vous attendez de voir si ça continue avant d'agir.",
          ],
          explanation:
            "Les absences courtes répétées sont l'un des indicateurs les plus fiables de mal-être au travail. Statistiquement, elles précèdent souvent une absence longue. Un manager attentif ne présume pas mais ouvre une porte : 'j'ai remarqué que tu as eu du mal à être là ces dernières semaines, est-ce que tu veux qu'on en parle ?'",
        },
        {
          id: "stress-1-q3",
          question:
            "Quels sont les trois stades du burn-out selon le modèle de Maslach ?",
          options: [
            "Épuisement émotionnel, dépersonnalisation, réduction du sentiment d'efficacité personnelle.",
            "Stress, fatigue, dépression.",
            "Surcharge, irritabilité, effondrement.",
            "Engagement excessif, désengagement, rupture.",
          ],
          explanation:
            "Le modèle de Maslach identifie trois dimensions : l'épuisement émotionnel (vide, n'en pouvant plus), la dépersonnalisation (cynisme, détachement des autres), et la baisse du sentiment d'efficacité ('je ne sers à rien'). Reconnaître ces signes permet d'intervenir avant l'effondrement.",
        },
        {
          id: "stress-1-q4",
          question:
            "Vous gérez une équipe très investie qui travaille régulièrement en dehors des heures. C'est bien, non ?",
          options: [
            "Non, nécessairement : c'est un signal de risque d'épuisement et potentiellement de sous-dimensionnement.",
            "Oui, c'est le signe d'une équipe engagée et performante.",
            "Ça dépend des résultats : si les objectifs sont atteints, c'est positif.",
            "Cela dépend si c'est choisi librement ou imposé.",
          ],
          explanation:
            "Les heures supplémentaires répétées sont un signal de risque, pas un indicateur de performance. Une équipe qui sur-travaille chroniquement est une équipe sous-dimensionnée, mal organisée, ou sous-pression excessive — et en route vers l'épuisement. Le manager doit investiguer la cause, pas célébrer le symptôme.",
        },
        {
          id: "stress-1-q5",
          question:
            "Comment distinguer un stress ponctuel et stimulant d'un stress chronique et nocif ?",
          options: [
            "La durée et la récupération : le stress ponctuel est suivi d'une phase de récupération, le chronique ne l'est pas.",
            "L'intensité : le stress fort est toujours nocif.",
            "La cause : le stress lié au travail est nocif, celui lié aux défis est stimulant.",
            "La perception du collaborateur : si il dit que ça va, c'est que ça va.",
          ],
          explanation:
            "Le stress est une réponse physiologique normale et parfois utile. Ce qui le rend nocif, c'est la chronicité : quand la pression est constante sans phase de récupération, le système s'épuise. Le 'bon stress' génère du dépassement suivi d'un retour au calme. Le stress chronique ne récupère jamais.",
        },
      ],
    },
    {
      id: "stress-2-prevention",
      title: "Prévenir et réduire la surcharge",
      description: "Agir avant la rupture",
      tier: "silver",
      passing_score_percent: 80,
      questions: [
        {
          id: "stress-2-q1",
          question:
            "Quelle est la responsabilité directe du manager dans la prévention du stress de son équipe ?",
          options: [
            "Organiser le travail de façon à ce que la charge soit soutenable et reconnaître les signaux d'alerte.",
            "Aucune : le stress est une affaire personnelle.",
            "Proposer des séances de yoga ou de méditation.",
            "Transmettre les demandes RH de soutien psychologique.",
          ],
          explanation:
            "Le manager est le premier facteur de stress ou de protection de son équipe. Sa responsabilité directe : organiser la charge de façon réaliste, prioriser, dire non à des demandes qui dépassent les capacités de l'équipe, et rester attentif aux signaux d'alerte individuels. Les dispositifs RH viennent en soutien, ils ne remplacent pas le manager.",
        },
        {
          id: "stress-2-q2",
          question:
            "Votre équipe est débordée et de nouvelles demandes arrivent de la direction. Comment gérez-vous cela ?",
          options: [
            "Vous remontez la situation à la direction en objectivant la charge actuelle, et négociez les priorités.",
            "Vous transmettez les demandes à l'équipe sans filtre : c'est leur travail.",
            "Vous absorbez les demandes sans informer la direction que la capacité est atteinte.",
            "Vous laissez l'équipe décider ce qu'elle prend ou non.",
          ],
          explanation:
            "Le manager est un filtre et un négociateur. Son rôle est d'objectiver la charge ('voici ce que l'équipe a déjà') et de négocier des priorités avec la direction ('si on prend ça, qu'est-ce qu'on enlève ?'). Transmettre sans filtre ou absorber silencieusement sont deux façons de brûler son équipe.",
        },
        {
          id: "stress-2-q3",
          question:
            "Quelle pratique réduit le plus efficacement le sentiment de surcharge dans une équipe ?",
          options: [
            "Clarifier explicitement les priorités et ce qui peut attendre.",
            "Réduire le nombre de réunions.",
            "Permettre plus de télétravail.",
            "Réduire les objectifs.",
          ],
          explanation:
            "L'ambiguïté des priorités est l'une des sources de stress les plus invalidantes. Quand tout est urgent, rien ne peut être posé. Clarifier explicitement — 'ce sprint, voici les 3 choses qui comptent vraiment, le reste peut glisser' — réduit massivement l'anxiété sans nécessairement réduire le volume de travail.",
        },
        {
          id: "stress-2-q4",
          question:
            "Un collaborateur vous demande de l'aide car il n'arrive pas à gérer sa charge. Quelle est votre première réponse ?",
          options: [
            "Examiner avec lui la liste de ses tâches pour identifier ce qui peut être déprioritisé, délégué ou reporté.",
            "Lui donner des conseils d'organisation personnelle.",
            "Lui dire que tout le monde est dans la même situation.",
            "Escalader aux RH pour un accompagnement.",
          ],
          explanation:
            "Face à une surcharge exprimée, la première réponse managériale est d'examiner concrètement la charge : qu'est-ce qui est vraiment prioritaire, qu'est-ce qui peut glisser, qui peut aider. Donner des conseils d'organisation avant d'avoir regardé la charge réelle suppose que le problème est dans l'organisation de la personne, pas dans la quantité de travail — ce qui est souvent faux.",
        },
        {
          id: "stress-2-q5",
          question:
            "Votre direction vous demande un livrable urgent alors que votre équipe est déjà surchargée. Quelle est la réponse assertive ?",
          options: [
            "\"On peut le faire si on décale X ou si on réduit la portée à Y — lequel préfères-tu ?\"",
            "\"Bien sûr, on va s'organiser.\"",
            "\"C'est impossible, on est débordés.\"",
            "\"Je vais voir ce que je peux faire et je reviens vers toi.\"",
          ],
          explanation:
            "L'assertivité managériale sur la charge : ni l'acceptation automatique ('bien sûr') qui brûle l'équipe, ni le refus sans proposition ('c'est impossible') qui bloque. La troisième voie : nommer la contrainte et proposer un choix ('si on fait ça, il faut enlever ça ou réduire ça'). C'est respectueux de l'équipe ET utile à la direction.",
        },
      ],
    },
    {
      id: "stress-3-posture",
      title: "Sa propre posture face au stress",
      description: "Gérer son propre stress pour mieux gérer l'équipe",
      tier: "gold",
      passing_score_percent: 80,
      questions: [
        {
          id: "stress-3-q1",
          question:
            "Un manager stressé dans son équipe — quelles en sont les conséquences pour son équipe ?",
          options: [
            "L'équipe absorbe le stress du manager par contagion émotionnelle.",
            "L'équipe n'est généralement pas affectée si le manager cache bien son stress.",
            "L'équipe est motivée à soutenir son manager.",
            "Cela n'a d'impact que si le manager exprime verbalement son stress.",
          ],
          explanation:
            "La contagion émotionnelle est un phénomène documenté : les émotions du manager, même non verbalisées, influencent le climat de l'équipe. Un manager chroniquement stressé crée une atmosphère de tension, même s'il n'en parle pas. Gérer son propre stress n'est pas une affaire personnelle — c'est un acte managérial.",
        },
        {
          id: "stress-3-q2",
          question:
            "Quelle est la différence entre poser une limite et refuser de travailler ?",
          options: [
            "Poser une limite définit ce qu'on peut faire et dans quelles conditions ; refuser ne propose rien.",
            "Il n'y en a pas : poser une limite, c'est dire non.",
            "Poser une limite s'adresse à la hiérarchie, refuser à l'équipe.",
            "Refuser est toujours plus efficace car plus clair.",
          ],
          explanation:
            "Poser une limite n'est pas un refus : c'est définir les conditions dans lesquelles on peut travailler bien. 'Je peux absorber cette demande si on décale celle-ci' est une limite. 'Je ne peux pas faire ça' sans alternative est un refus. La limite préserve la qualité et la relation ; le refus sec ferme le dialogue.",
        },
        {
          id: "stress-3-q3",
          question:
            "Quels sont les signaux que vous, en tant que manager, êtes en train de dépasser vos propres limites ?",
          options: [
            "Vous êtes irritable, vous dormez moins bien, vous avez du mal à déconnecter et vos décisions manquent de qualité.",
            "Vous travaillez plus de 50 heures par semaine régulièrement.",
            "Vos résultats commencent à baisser.",
            "Vous ressentez de la culpabilité à partir avant vos collaborateurs.",
          ],
          explanation:
            "Les signaux précoces du dépassement de limite chez le manager : irritabilité (réponses disproportionnées), sommeil perturbé, incapacité à déconnecter mentalement, et dégradation de la qualité des décisions. Ces signaux précèdent les résultats mesurables. Les reconnaître en soi demande de la lucidité — et du courage.",
        },
        {
          id: "stress-3-q4",
          question:
            "Quelle pratique aide le plus un manager à maintenir sa propre régulation émotionnelle dans les situations de pression ?",
          options: [
            "Créer des routines de récupération régulières : pauses, coupure numérique, activité physique.",
            "Ne jamais montrer ses émotions à l'équipe.",
            "Déléguer les situations stressantes à ses collaborateurs.",
            "Attendre les congés pour se ressourcer.",
          ],
          explanation:
            "La régulation émotionnelle se construit dans le quotidien, pas dans les vacances. Des pauses courtes, des coupures numériques, de l'activité physique régulière : ces 'micro-récupérations' maintiennent la capacité à gérer le stress. Attendre les vacances pour se ressourcer, c'est fonctionner à vide pendant des mois.",
        },
        {
          id: "stress-3-q5",
          question:
            "Votre organisation est structurellement sous-dimensionnée et vous le savez. Vous ne pouvez pas changer ça seul. Quelle est la bonne posture managériale ?",
          options: [
            "Nommer la situation à votre propre hiérarchie avec des données, poser des limites claires, et en parler honnêtement à votre équipe.",
            "Absorber en silence pour protéger votre image.",
            "Démissionner si rien ne change.",
            "Demander à votre équipe de faire de son mieux avec ce qu'il y a.",
          ],
          explanation:
            "Face à une contrainte structurelle, la posture managériale honnête : remonter avec des données ('voici la capacité réelle, voici l'impact du sous-dimensionnement'), poser des limites claires sur ce que l'équipe peut absorber, et être transparent avec l'équipe sur la situation sans amplifier l'anxiété. Absorber en silence protège à court terme et brûle à long terme.",
        },
      ],
    },
    {
      id: "stress-final",
      title: "Examen final — Gestion du stress et de la charge",
      description: "Mise en situation de bout en bout",
      tier: "final",
      passing_score_percent: 80,
      questions: [
        {
          id: "stress-final-q1",
          question:
            "Un collaborateur très performant vous dit qu'il 'gère' mais vous remarquez des signes de fatigue depuis plusieurs semaines. Quelle est votre démarche ?",
          options: [
            "Vous ouvrez une conversation : 'J'observe que tu sembles fatigué ces dernières semaines. Tu veux qu'on en parle ?'",
            "Vous lui faites confiance : s'il dit que ça va, c'est que ça va.",
            "Vous réduisez sa charge sans lui demander son avis.",
            "Vous attendez qu'il vienne lui-même.",
          ],
          explanation:
            "Les performants ont souvent une forte résistance à admettre leurs limites — par fierté ou crainte d'être perçus comme moins solides. Ouvrir une porte sans forcer ('tu veux qu'on en parle ?') est respectueux. C'est aussi l'acte de management le plus protecteur : repérer avant que la personne ne s'effondre.",
        },
        {
          id: "stress-final-q2",
          question:
            "Quelle est la distinction entre charge de travail objective et charge de travail perçue ?",
          options: [
            "La charge objective est mesurable (heures, tâches) ; la charge perçue est subjective et dépend du sens, du contrôle et du soutien.",
            "La charge objective est celle du manager, la charge perçue est celle du collaborateur.",
            "Il n'y a pas de différence pratique : la charge est la charge.",
            "La charge perçue est toujours plus élevée que la charge réelle.",
          ],
          explanation:
            "Deux personnes avec la même charge objective peuvent la vivre très différemment selon le sens qu'elles y trouvent, le contrôle qu'elles ont sur leur travail et le soutien qu'elles reçoivent. C'est le modèle de Karasek (demande-contrôle-soutien) : la souffrance au travail naît souvent d'une forte demande combinée à un faible contrôle et peu de soutien.",
        },
        {
          id: "stress-final-q3",
          question:
            "Votre équipe est sous forte pression depuis 3 mois. Le projet se termine dans 2 semaines. Comment gérez-vous la fin de sprint ?",
          options: [
            "Vous reconnaissez l'effort collectif, nommez la fin proche, et commencez à planifier la décompression post-projet.",
            "Vous maintenez la pression jusqu'à la fin : encore un effort.",
            "Vous attendez la fin du projet pour célébrer.",
            "Vous réduisez les objectifs finaux pour soulager l'équipe.",
          ],
          explanation:
            "La fin de sprint sous pression nécessite une gestion active : reconnaître l'effort déjà fourni, nommer explicitement que la fin est proche ('encore 2 semaines'), et signaler déjà la récupération prévue. Cela donne un horizon visible, ce qui est l'une des choses les plus efficaces pour tenir sous pression.",
        },
        {
          id: "stress-final-q4",
          question:
            "Qu'est-ce que le présentéisme et pourquoi est-il problématique ?",
          options: [
            "A et B sont toutes les deux correctes.",
            "Le fait de venir travailler même malade, qui réduit la productivité et le risque de contamination.",
            "Le fait d'être physiquement présent mais mentalement absent, souvent signe d'épuisement ou de désengagement.",
            "Le fait de toujours être disponible par messagerie instantanée.",
          ],
          explanation:
            "Le présentéisme a deux dimensions également problématiques : venir travailler malade (qui réduit les performances de 30 à 60% selon les études et favorise la propagation des maladies) ET être là sans être là (signe d'épuisement psychologique avancé). Les deux sont des signaux managériaux à prendre au sérieux.",
        },
        {
          id: "stress-final-q5",
          question:
            "Votre collaborateur revient d'un arrêt pour burn-out. Quelle erreur managériale est la plus courante dans ce contexte ?",
          options: [
            "Le remettre immédiatement dans ses responsabilités complètes pour 'ne pas le marginaliser'.",
            "Faire un entretien de retour.",
            "Lui confier progressivement des responsabilités réduites au début.",
            "Demander un avis médical avant le retour.",
          ],
          explanation:
            "Le retour immédiat en plein régime est l'erreur la plus répandue — et souvent motivée par de bonnes intentions ('je veux lui montrer que j'ai confiance'). Après un burn-out, le retour progressif (charge réduite, responsabilités élargies progressivement) est indispensable pour éviter la rechute. La progressivité n'est pas de la méfiance — c'est de la prudence.",
        },
        {
          id: "stress-final-q6",
          question:
            "Quel comportement du manager crée le plus de stress dans une équipe, selon les études sur le management toxique ?",
          options: [
            "L'imprévisibilité : humeurs changeantes, messages contradictoires, critères de succès flous.",
            "Exiger des résultats ambitieux.",
            "Manquer de disponibilité.",
            "Donner trop de feedback.",
          ],
          explanation:
            "L'imprévisibilité est le facteur de stress managérial le plus nocif. Quand les collaborateurs ne savent pas à quoi s'attendre (l'humeur du manager change, les règles varient, ce qui était bien hier est mal aujourd'hui), l'anxiété est permanente. La prévisibilité du manager — même exigeante — crée de la sécurité. L'imprévisibilité détruit la confiance.",
        },
        {
          id: "stress-final-q7",
          question:
            "Comment un manager peut-il modéliser une bonne gestion du stress pour son équipe ?",
          options: [
            "En verbali sant lui-même ses limites, en prenant des pauses visibles, et en protégeant les week-ends et soirées de son équipe.",
            "En cachant son propre stress pour ne pas contaminer l'équipe.",
            "En organisant des sessions de gestion du stress pour l'équipe.",
            "En s'assurant que personne ne travaille plus de 40 heures par semaine.",
          ],
          explanation:
            "Le manager qui dit 'je m'arrête là pour ce soir' ou 'je ne réponds pas aux messages le week-end' donne une permission implicite à son équipe de faire pareil. Verbaliser ses propres limites, prendre des pauses visibles, ne pas envoyer d'emails à 23h : ces comportements modélisent une culture de travail soutenable plus efficacement que n'importe quelle politique RH.",
        },
        {
          id: "stress-final-q8",
          question:
            "Vous suspectez qu'un collaborateur est en situation de risque psychosocial sérieux. Quelle est votre démarche ?",
          options: [
            "Ouvrir un espace de dialogue avec le collaborateur, l'orienter vers les ressources disponibles (médecine du travail, RH, référent), et informer votre propre hiérarchie si le risque est sérieux.",
            "Gérer en direct sans en parler à personne pour protéger sa confidentialité.",
            "Appeler directement les urgences si vous pensez qu'il est en danger.",
            "Attendre de voir si la situation s'améliore d'elle-même.",
          ],
          explanation:
            "Face à un risque psychosocial sérieux, le manager n'est ni seul ni omnipotent. Sa responsabilité : ouvrir un espace, écouter, orienter vers les ressources professionnelles (médecin du travail, programme d'aide aux employés, RH), et signaler à sa hiérarchie si le risque est grave. Gérer seul en secret peut exposer le manager légalement et ne pas apporter le soutien nécessaire.",
        },
      ],
    },
  ],
};
