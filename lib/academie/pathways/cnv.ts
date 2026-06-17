import type { AcademiePathway } from "@/lib/types";

export const CNV_PATHWAY: AcademiePathway = {
  id: "cnv",
  title: "Communication Non Violente",
  short_description: "Les fondamentaux de la CNV pour managers",
  long_description:
    "Apprenez à formuler observations, sentiments, besoins et demandes selon la méthode de Marshall Rosenberg. Un fondamental pour tout manager qui veut désamorcer plutôt qu'attiser.",
  icon_name: "MessageCircleHeart",
  color_theme: "blue",
  estimated_minutes: 15,
  is_available: true,
  final_badge: {
    name: "Praticien CNV",
    description: "Vous maîtrisez les fondamentaux de la Communication Non Violente.",
  },
  quizzes: [
    {
      id: "cnv-1-observation",
      title: "Observer sans juger",
      description: "Distinguer le fait de l'interprétation",
      tier: "bronze",
      passing_score_percent: 80,
      questions: [
        // cnv-01 (original)
        {
          id: "cnv-1-q1",
          question: "Quelle phrase est une OBSERVATION au sens de la CNV ?",
          options: [
            "Tu es arrivé après 9h30 trois fois cette semaine.",
            "Tu n'es jamais à l'heure.",
            "Tu te fiches complètement des horaires.",
            "Tu manques de respect à l'équipe par tes retards.",
          ],
          explanation:
            "Une observation CNV est factuelle, datée, quantifiable. Les trois autres formulations sont des jugements ou des interprétations.",
        },
        // cnv-06 (original)
        {
          id: "cnv-1-q2",
          question: "Parmi ces formulations, laquelle évite le JUGEMENT moralisateur ?",
          options: [
            "Tu as livré le dossier 3 jours après la deadline annoncée.",
            "Tu es irresponsable.",
            "Tu ne respectes rien ni personne.",
            "Tu es la pire recrue qu'on ait eue.",
          ],
          explanation:
            "Le jugement moralisateur étiquette la personne ('irresponsable', 'pire'). La CNV s'en tient aux faits observables et mesurables.",
        },
        // nouvelle question
        {
          id: "cnv-1-q3",
          question:
            "Votre collaborateur a interrompu trois collègues lors de la dernière réunion. Quelle formulation est une observation CNV ?",
          options: [
            "Lors de la réunion de jeudi, tu as pris la parole pendant que trois personnes s'exprimaient encore.",
            "Tu n'écoutes jamais les autres.",
            "Tu es dominant et tu écrases les autres.",
            "Tu as encore été irrespectueux aujourd'hui.",
          ],
          explanation:
            "L'observation CNV situe le fait dans le temps ('jeudi'), le décrit sans interprétation ('pris la parole pendant que') et reste vérifiable par tous.",
        },
        // nouvelle question
        {
          id: "cnv-1-q4",
          question:
            "Laquelle de ces phrases contient une ÉVALUATION déguisée en observation ?",
          options: [
            "Tu es toujours en train de te plaindre.",
            "Tu as exprimé trois préoccupations différentes ce matin.",
            "Lors du standup, tu as mentionné deux blocages.",
            "Tu as envoyé ce rapport à 18h45 hier.",
          ],
          explanation:
            "'Toujours en train de se plaindre' est un jugement sur un comportement, pas une observation. 'Toujours' et 'se plaindre' sont des généralisations évaluatives.",
        },
        // nouvelle question
        {
          id: "cnv-1-q5",
          question:
            "Un manager CNV qui veut ouvrir une conversation difficile commencera par :",
          options: [
            "Rappeler le fait précis et daté qui motive la conversation.",
            "Exposer d'emblée les conséquences si rien ne change.",
            "Demander au collaborateur ce qu'il pense de son comportement.",
            "Partager l'avis de l'équipe sur la situation.",
          ],
          explanation:
            "La CNV ancre toujours la conversation dans une observation partageable, pas dans une opinion ou une menace. Cela crée un terrain commun avant d'aller plus loin.",
        },
      ],
    },
    {
      id: "cnv-2-sentiments-besoins",
      title: "Sentiments et besoins",
      description: "Nommer ce qui se passe en soi",
      tier: "silver",
      passing_score_percent: 80,
      questions: [
        // cnv-02 (original)
        {
          id: "cnv-2-q1",
          question: "Lequel de ces énoncés exprime un SENTIMENT au sens CNV ?",
          options: [
            "Je me sens frustré.",
            "Je me sens trahi par toi.",
            "Je sens que tu ne m'écoutes pas.",
            "J'ai l'impression que tu te moques de moi.",
          ],
          explanation:
            "Un sentiment CNV est un état intérieur, sans accusation déguisée. 'Trahi' implique une action d'autrui. 'Tu ne m'écoutes pas' et 'tu te moques' sont des interprétations, pas des sentiments.",
        },
        // cnv-03 (original)
        {
          id: "cnv-2-q2",
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
        },
        // cnv-07 (original)
        {
          id: "cnv-2-q3",
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
        },
        // cnv-12 (original)
        {
          id: "cnv-2-q4",
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
        },
        // nouvelle question
        {
          id: "cnv-2-q5",
          question:
            "Un collaborateur dit : 'Je me sens incompris.' En CNV, quel besoin non satisfait cela révèle-t-il le plus probablement ?",
          options: [
            "Un besoin de reconnaissance ou d'écoute.",
            "Un besoin de liberté d'expression.",
            "Un besoin de cohérence dans les décisions.",
            "Un besoin de sécurité dans son poste.",
          ],
          explanation:
            "Se sentir incompris pointe vers un besoin d'écoute ou de reconnaissance — être vu et entendu tel qu'on est. La CNV invite à explorer ce besoin plutôt qu'à rassurer ou contredire.",
        },
      ],
    },
    {
      id: "cnv-3-demandes",
      title: "Formuler une demande",
      description: "Demander vs exiger",
      tier: "gold",
      passing_score_percent: 80,
      questions: [
        // cnv-04 (original)
        {
          id: "cnv-3-q1",
          question: "Qu'est-ce qu'une DEMANDE en CNV ?",
          options: [
            "Une action concrète, positive, négociable, formulée au présent.",
            "Une exigence claire qui ne laisse pas place à la discussion.",
            "Une suggestion vague que l'autre interprète comme il veut.",
            "Un reproche reformulé en question rhétorique.",
          ],
          explanation:
            "Une demande CNV est concrète ('peux-tu m'envoyer le rapport avant 17h ?'), formulée positivement, et reste négociable — sinon c'est une exigence.",
        },
        // cnv-13 (original)
        {
          id: "cnv-3-q2",
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
        },
        // cnv-14 (original)
        {
          id: "cnv-3-q3",
          question: "Qu'est-ce qui distingue une EXIGENCE d'une DEMANDE en CNV ?",
          options: [
            "Dans une demande, un 'non' de l'autre reste acceptable ; dans une exigence, non.",
            "Une demande est polie, une exigence est sèche.",
            "Une demande est verbale, une exigence est écrite.",
            "Une demande s'adresse aux pairs, une exigence aux subordonnés.",
          ],
          explanation:
            "Le test est simple : si tu réagis mal à un refus, c'était une exigence, pas une demande. Cela invite à clarifier les enjeux plutôt qu'à imposer.",
        },
        // nouvelle question
        {
          id: "cnv-3-q4",
          question:
            "Parmi ces formulations, laquelle constitue une demande CNV valide ?",
          options: [
            "Peux-tu m'envoyer un point d'avancement par écrit avant vendredi 12h ?",
            "Il faudrait que tu communiques mieux.",
            "J'aimerais que tu te remettes en question.",
            "Est-ce que tu peux faire un effort sur les délais ?",
          ],
          explanation:
            "Une demande CNV est précise, positive, datée et réalisable. 'Communiquer mieux' ou 'faire un effort' sont trop vagues ; 'se remettre en question' est une injonction identitaire.",
        },
        // nouvelle question
        {
          id: "cnv-3-q5",
          question:
            "Après avoir exprimé un besoin non satisfait, un manager CNV conclut son message par :",
          options: [
            "Une question ouverte sur ce que l'autre peut proposer comme solution.",
            "La liste des conséquences si la situation perdure.",
            "Une affirmation de ce qu'il attend exactement.",
            "Un silence pour laisser l'autre réfléchir seul.",
          ],
          explanation:
            "La demande CNV est co-construite : on invite l'autre à proposer plutôt qu'on lui impose. La question ouverte préserve l'autonomie et favorise l'engagement.",
        },
      ],
    },
    {
      id: "cnv-final",
      title: "Examen final CNV",
      description: "Mise en pratique transversale",
      tier: "final",
      passing_score_percent: 80,
      questions: [
        // cnv-05 (original)
        {
          id: "cnv-f-q1",
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
        },
        // cnv-08 (original)
        {
          id: "cnv-f-q2",
          question: "Quel est l'objectif principal de la CNV en contexte managérial ?",
          options: [
            "Créer les conditions d'un dialogue où chacun se sent entendu et libre de coopérer.",
            "Obtenir que l'autre fasse ce qu'on attend de lui.",
            "Éviter tout conflit dans l'équipe.",
            "Adopter un ton toujours doux et conciliant.",
          ],
          explanation:
            "La CNV vise la qualité du lien et la coopération, pas l'obtention d'un comportement. Elle ne fuit pas le conflit, elle le traite autrement.",
        },
        // cnv-09 (original)
        {
          id: "cnv-f-q3",
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
        },
        // cnv-10 (original)
        {
          id: "cnv-f-q4",
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
        },
        // cnv-11 (original)
        {
          id: "cnv-f-q5",
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
        },
        // cnv-15 (original)
        {
          id: "cnv-f-q6",
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
        },
        // nouvelle question 1
        {
          id: "cnv-f-q7",
          question:
            "Un collaborateur refuse votre demande. En CNV, la première réaction du manager est de :",
          options: [
            "Chercher à comprendre le besoin derrière ce refus.",
            "Rappeler que c'est une décision managériale qui ne se discute pas.",
            "Proposer immédiatement une solution alternative.",
            "Documenter le refus pour un prochain entretien formel.",
          ],
          explanation:
            "Un refus masque toujours un besoin non satisfait. La CNV encourage à explorer ce besoin avant de chercher une issue — ce qui produit des solutions plus durables.",
        },
        // nouvelle question 2
        {
          id: "cnv-f-q8",
          question:
            "Quelle séquence OSBD est correctement formée ?",
          options: [
            "Quand je vois le rapport non envoyé à 17h (O), je me sens inquiet (S), car j'ai besoin de visibilité sur l'avancement (B). Peux-tu m'envoyer un statut avant 18h aujourd'hui ? (D)",
            "Je sais que tu as du mal à t'organiser (O), c'est frustrant pour moi (S), j'ai besoin que tu t'améliores (B), fais mieux la prochaine fois (D).",
            "Je veux te parler de quelque chose (O), je suis déçu (S), tu dois être plus sérieux (B), tiens tes engagements (D).",
            "Ton retard (O) me stresse (S), j'ai besoin que tu fasses un effort (B), sois ponctuel (D).",
          ],
          explanation:
            "La seule séquence valide contient : un fait daté et précis (O), un sentiment intérieur réel (S), un besoin universel non dépendant d'une action (B), et une demande concrète et négociable (D).",
        },
      ],
    },
  ],
};
