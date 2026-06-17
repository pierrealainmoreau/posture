import type { AcademiePathway } from "@/lib/types";

export const MOTIVATION_PATHWAY: AcademiePathway = {
  id: "motivation",
  title: "Motivation et reconnaissance",
  short_description: "Ce qui engage vraiment les collaborateurs",
  long_description:
    "La prime n'est pas le seul levier. Comprendre les besoins profonds de chaque collaborateur, adapter sa posture, reconnaître au bon moment et de la bonne façon : des compétences rares qui fidélisent et engagent durablement.",
  icon_name: "Flame",
  color_theme: "orange",
  estimated_minutes: 15,
  is_available: true,
  final_badge: {
    name: "Manager engageant",
    description:
      "Vous savez identifier ce qui motive chacun et activer les bons leviers.",
  },
  quizzes: [
    {
      id: "motivation-1-fondamentaux",
      title: "Comprendre la motivation",
      description: "Intrinsèque, extrinsèque, et ce qui dure",
      tier: "bronze",
      passing_score_percent: 80,
      questions: [
        {
          id: "motivation-1-q1",
          question:
            "Selon les recherches en psychologie du travail, quelle est la différence principale entre motivation intrinsèque et extrinsèque ?",
          options: [
            "La motivation intrinsèque vient du sens et du plaisir de l'activité elle-même, l'extrinsèque des récompenses externes.",
            "La motivation intrinsèque vient des récompenses, l'extrinsèque du plaisir.",
            "La motivation intrinsèque est plus facile à activer pour un manager.",
            "L'une est durable et l'autre non, sans que l'on sache laquelle.",
          ],
          explanation:
            "La motivation intrinsèque (intérêt, sens, maîtrise, autonomie) est la plus durable et la plus résistante aux difficultés. La motivation extrinsèque (salaire, primes, reconnaissance externe) peut déclencher un effort mais s'épuise vite et peut même réduire la motivation intrinsèque si mal utilisée.",
        },
        {
          id: "motivation-1-q2",
          question:
            "Selon le modèle de Maslow adapté au travail, quel besoin, s'il n'est pas satisfait, bloque tous les autres ?",
          options: [
            "Les besoins de base : sécurité de l'emploi et conditions de travail.",
            "Le besoin de reconnaissance.",
            "Le besoin d'appartenance à l'équipe.",
            "Le besoin d'accomplissement et de sens.",
          ],
          explanation:
            "Un collaborateur qui doute de la sécurité de son poste ou qui souffre de ses conditions de travail ne peut pas s'engager sur des besoins supérieurs (appartenance, estime, accomplissement). C'est le socle : tant qu'il est instable, les autres leviers ont peu d'effet.",
        },
        {
          id: "motivation-1-q3",
          question:
            "La théorie de l'autodétermination (Deci & Ryan) identifie trois besoins psychologiques fondamentaux au travail. Lesquels ?",
          options: [
            "Compétence, autonomie, appartenance.",
            "Salaire, sécurité, progression.",
            "Reconnaissance, défi, équité.",
            "Sens, plaisir, récompense.",
          ],
          explanation:
            "Compétence (se sentir efficace), autonomie (avoir du choix dans son travail), appartenance (se sentir lié à une équipe et un collectif) : ces trois besoins sont universels et leur satisfaction prédit l'engagement et le bien-être au travail, indépendamment des récompenses financières.",
        },
        {
          id: "motivation-1-q4",
          question:
            "Un collaborateur très performant démissionne pour un poste avec un salaire identique dans une autre entreprise. Quelle est la cause la plus probable ?",
          options: [
            "Un besoin non satisfait — sens, autonomie, reconnaissance, perspective — n'était pas comblé.",
            "Il était mal payé et a trouvé des avantages cachés ailleurs.",
            "Il avait des problèmes relationnels avec ses collègues.",
            "Il cherchait un changement de secteur.",
          ],
          explanation:
            "Quand un performant part sans augmentation de salaire, c'est presque toujours un signal de besoins non satisfaits : manque de sens, plafond d'autonomie atteint, absence de perspective d'évolution, ou reconnaissance insuffisante. Le salaire ne retient pas les gens, il ne fait que les faire partir moins vite.",
        },
        {
          id: "motivation-1-q5",
          question:
            "Quel est l'effet dit 'overjustification' dans le domaine de la motivation ?",
          options: [
            "Récompenser excessivement une activité intrinsèquement motivante peut réduire le plaisir qu'on en tire.",
            "Trop expliquer les décisions démotive les équipes.",
            "La surcharge de travail crée une motivation accrue à court terme.",
            "Un manager trop enthousiaste intimide ses collaborateurs.",
          ],
          explanation:
            "Quand on commence à récompenser financièrement une activité qu'on faisait par plaisir, on risque de transformer le plaisir en transaction. C'est l'effet overjustification : la récompense externe prend le dessus et érode la motivation intrinsèque. Un manager doit doser la reconnaissance matérielle avec soin.",
        },
      ],
    },
    {
      id: "motivation-2-reconnaissance",
      title: "L'art de la reconnaissance",
      description: "Reconnaître au bon moment, de la bonne façon",
      tier: "silver",
      passing_score_percent: 80,
      questions: [
        {
          id: "motivation-2-q1",
          question:
            "Votre collaborateur vient de terminer un rapport de qualité dans un délai serré. Quelle forme de reconnaissance est la plus efficace ?",
          options: [
            "Un retour sincère et spécifique en face à face : ce qu'il a fait, pourquoi ça compte, l'impact que ça a eu.",
            "\"Bon travail !\" en réunion d'équipe.",
            "Un email de remerciement copiant son N+2.",
            "Une prime exceptionnelle.",
          ],
          explanation:
            "La reconnaissance la plus impactante est spécifique, sincère et directe. Nommer précisément ce qui a été fait, pourquoi c'est notable, et quel impact ça a eu — cela donne du sens à l'effort et renforce l'estime de soi. Un 'bon travail' vague, au contraire, glisse sans laisser de trace.",
        },
        {
          id: "motivation-2-q2",
          question:
            "Lequel de ces types de reconnaissance répond au besoin d'appartenance et de lien ?",
          options: [
            "Un mot d'encouragement personnel, en dehors de tout contexte de performance.",
            "Une promotion.",
            "Être inclus dans une décision importante en tant qu'expert référent.",
            "Un bonus de fin d'année.",
          ],
          explanation:
            "La reconnaissance existentielle — 'je te vois en tant que personne, pas seulement pour ta performance' — répond au besoin d'appartenance. Un mot sincère qui ne parle pas de résultats ('j'apprécie ta façon d'être dans l'équipe') est souvent plus marquant qu'une récompense liée à un livrable.",
        },
        {
          id: "motivation-2-q3",
          question:
            "Vous gérez une équipe de 6 personnes. Lucas aime être reconnu publiquement, Sophie déteste ça. Comment adaptez-vous votre reconnaissance ?",
          options: [
            "Vous demandez à chacun comment il préfère être reconnu et vous adaptez en conséquence.",
            "Vous traitez tout le monde de la même façon pour éviter les jalousies.",
            "Vous ne reconnaissez plus publiquement pour ne pas mettre Sophie mal à l'aise.",
            "Vous adaptez uniquement si quelqu'un se plaint.",
          ],
          explanation:
            "La reconnaissance n'est efficace que si elle est reçue comme telle. Demander à chaque collaborateur ce qui compte pour lui est un acte managérial simple et puissant. Certains veulent de la visibilité, d'autres de la discrétion, d'autres de la délégation de confiance. L'équité n'est pas l'uniformité.",
        },
        {
          id: "motivation-2-q4",
          question:
            "À quel moment la reconnaissance perd-elle son effet, voire devient contre-productive ?",
          options: [
            "Quand elle n'est pas perçue comme sincère ou méritée.",
            "Quand elle est trop fréquente.",
            "Quand elle est donnée devant toute l'équipe.",
            "Quand elle n'est pas accompagnée d'une récompense matérielle.",
          ],
          explanation:
            "La reconnaissance inflationniste ('bravo' pour tout et n'importe quoi) ou perçue comme intéressée ('il dit ça pour que je travaille plus') perd tout impact. Pire, elle peut générer du cynisme. La reconnaissance doit être méritée, sincère et spécifique pour rester un levier puissant.",
        },
        {
          id: "motivation-2-q5",
          question:
            "Un collaborateur discret, rarement en difficulté, livre régulièrement un travail de qualité sans chercher les projecteurs. Comment le reconnaissez-vous ?",
          options: [
            "Vous prenez un moment individuel pour lui dire précisément ce que vous observez et ce que ça apporte à l'équipe.",
            "Pas besoin : s'il ne se plaint pas, tout va bien.",
            "Vous l'incluez dans vos remerciements collectifs en réunion.",
            "Vous augmentez ses responsabilités pour lui montrer que vous lui faites confiance.",
          ],
          explanation:
            "Les collaborateurs discrets et fiables sont souvent les plus invisibles — et les premiers à partir en silence quand ils se sentent pris pour acquis. Un moment individuel et sincère, qui nomme précisément ce qu'on voit, a un impact disproportionné sur leur engagement.",
        },
      ],
    },
    {
      id: "motivation-3-engagement-durable",
      title: "Entretenir l'engagement dans le temps",
      description: "Prévenir la démotivation, relancer l'envie",
      tier: "gold",
      passing_score_percent: 80,
      questions: [
        {
          id: "motivation-3-q1",
          question:
            "Un collaborateur autrefois très engagé est devenu amorphe. Il fait son travail mais sans plus. Quelle est votre première démarche ?",
          options: [
            "Lui proposer un entretien individuel pour comprendre ce qui s'est passé.",
            "Lui fixer des objectifs plus ambitieux pour le stimuler.",
            "Lui parler de sa baisse d'implication en réunion d'équipe.",
            "Attendre que ça passe, les cycles de motivation varient.",
          ],
          explanation:
            "Avant toute action, il faut comprendre. Un entretien individuel bienveillant — 'j'ai l'impression que quelque chose a changé, est-ce que tu veux qu'on en parle ?' — ouvre une porte. La cause peut être personnelle, managériale ou organisationnelle. Diagnostiquer avant de prescrire.",
        },
        {
          id: "motivation-3-q2",
          question:
            "Quelle est la différence entre un collaborateur 'désengagé' et un collaborateur 'activement désengagé' ?",
          options: [
            "Le désengagé fait son travail sans s'investir ; l'activement désengagé peut nuire à la dynamique d'équipe.",
            "Le désengagé est moins performant, l'activement désengagé démissionne.",
            "Il n'y a pas de différence réelle.",
            "L'activement désengagé est toujours en conflit avec son manager.",
          ],
          explanation:
            "Un collaborateur désengagé 'fait le job' sans plus — il est présent physiquement mais absent émotionnellement. L'activement désengagé va plus loin : il peut saboter l'ambiance, décourager ses collègues, critiquer en dehors des canaux officiels. Les deux nécessitent une action managériale, mais d'une autre nature.",
        },
        {
          id: "motivation-3-q3",
          question:
            "Quelle pratique favorise le mieux l'engagement à long terme dans une équipe ?",
          options: [
            "Des entretiens individuels fréquents centrés sur les aspirations et le développement.",
            "Des team buildings réguliers.",
            "Un système de primes collectives.",
            "Des objectifs ambitieux qui challengent l'équipe.",
          ],
          explanation:
            "Les 1:1 (entretiens individuels réguliers) centrés sur la personne — ses aspirations, ses freins, son développement — sont le levier d'engagement le plus robuste et le plus documenté. Ils signalent à chaque collaborateur qu'il compte en tant qu'individu, pas seulement comme ressource.",
        },
        {
          id: "motivation-3-q4",
          question:
            "Vous êtes manager d'une équipe en période de changement et d'incertitude forte. Comment maintenez-vous la motivation ?",
          options: [
            "Vous donnez des informations dès que vous en avez, même incomplètes, et nommez ce qui est incertain.",
            "Vous évitez de parler du changement pour ne pas inquiéter.",
            "Vous promettez que tout ira bien pour rassurer.",
            "Vous augmentez la pression sur les résultats pour que l'équipe reste focalisée.",
          ],
          explanation:
            "En période d'incertitude, le silence du manager est interprété comme un signe négatif. Partager les informations disponibles — même partielles — et nommer l'incertain ('je ne sais pas encore, voici ce que je sais') construit la confiance. Les promesses vides et la pression accrue ont l'effet inverse.",
        },
        {
          id: "motivation-3-q5",
          question:
            "Lequel de ces signes indique que votre pratique de reconnaissance fonctionne bien dans votre équipe ?",
          options: [
            "Les collaborateurs se reconnaissent également entre eux, sans que vous en soyez l'intermédiaire.",
            "Tout le monde vous dit merci en retour.",
            "Il n'y a plus de conflits dans l'équipe.",
            "Vos meilleurs collaborateurs ne cherchent plus à évoluer.",
          ],
          explanation:
            "Une culture de reconnaissance mature se diffuse horizontalement : les collaborateurs se valorisent entre eux, sans passer par le manager. C'est le signe que vous avez créé un environnement où la reconnaissance est une norme collective, pas une dépendance managériale.",
        },
      ],
    },
    {
      id: "motivation-final",
      title: "Examen final — Motivation et reconnaissance",
      description: "Mise en situation de bout en bout",
      tier: "final",
      passing_score_percent: 80,
      questions: [
        {
          id: "motivation-final-q1",
          question:
            "Votre direction vous demande de motiver votre équipe pour absorber une surcharge de travail temporaire, sans budget supplémentaire. Quelle est votre approche prioritaire ?",
          options: [
            "Expliquer le sens de l'effort, les enjeux réels, et reconnaître explicitement la contribution de chacun.",
            "Promettre une récompense dès que le budget sera disponible.",
            "Augmenter les objectifs pour challenger l'équipe.",
            "Éviter d'en parler pour ne pas démotiver davantage.",
          ],
          explanation:
            "Sans budget, les leviers sont le sens, la transparence et la reconnaissance. Nommer pourquoi l'effort compte, reconnaître explicitement la charge acceptée, et remercier sincèrement sont les outils les plus puissants dans ce contexte. Les promesses non tenues sont pires que rien.",
        },
        {
          id: "motivation-final-q2",
          question:
            "Karim est très compétent mais ne semble plus s'investir. Il dit que son travail est 'ennuyeux'. Quelle est votre réponse managériale ?",
          options: [
            "Explorer avec lui quelles missions l'engageraient davantage et chercher des façons de lui en confier.",
            "Lui dire que tout le monde s'ennuie parfois et que c'est normal.",
            "Lui rappeler ses objectifs et ce qu'on attend de lui.",
            "Le muter dans une autre équipe.",
          ],
          explanation:
            "L'ennui est un signal de sous-emploi des compétences ou d'absence de défi. Avant de perdre un bon élément, explorer ses aspirations et chercher comment réenrichir son poste (délégation de missions plus complexes, participation à des projets transverses) est la réponse juste.",
        },
        {
          id: "motivation-final-q3",
          question:
            "Quelle erreur un manager commet-il en disant systématiquement 'excellent travail' à chaque livrable ?",
          options: [
            "Il dévalue la reconnaissance : si tout est 'excellent', rien ne l'est vraiment.",
            "Il crée des attentes de promotion.",
            "Il favorise les comportements compétitifs entre collègues.",
            "Il sous-entend que les collaborateurs ont besoin d'être constamment rassurés.",
          ],
          explanation:
            "La reconnaissance inflationniste perd son sens. Si chaque livrable mérite un 'excellent', le terme ne signifie plus rien. Réserver les marqueurs forts ('excellent', 'remarquable', 'je suis vraiment impressionné') à ce qui les mérite vraiment — et être plus nuancé le reste du temps — préserve leur impact.",
        },
        {
          id: "motivation-final-q4",
          question:
            "Deux collaborateurs ont atteint le même objectif. L'un préfère être félicité en public, l'autre en privé. Comment gérez-vous cela ?",
          options: [
            "Vous adaptez votre reconnaissance à la préférence de chacun.",
            "Vous choisissez l'un ou l'autre pour tout le monde afin d'être cohérent.",
            "Vous ne reconnaissez ni l'un ni l'autre pour éviter les jalousies.",
            "Vous en parlez à l'équipe pour qu'elle comprenne vos pratiques.",
          ],
          explanation:
            "L'équité managériale ne signifie pas l'uniformité : elle signifie donner à chacun ce dont il a besoin. Adapter la forme de reconnaissance à la personne est un acte de respect individuel. Demander simplement 'comment est-ce que tu préfères qu'on te reconnaisse ?' prend trente secondes et change tout.",
        },
        {
          id: "motivation-final-q5",
          question:
            "Un collaborateur performant vous dit vouloir évoluer vers plus de responsabilités. Votre organisation ne peut pas lui offrir de promotion à court terme. Que faites-vous ?",
          options: [
            "Explorer avec lui d'autres formes de développement : projet transverse, expertise, mentoring, périmètre élargi.",
            "Lui dire d'être patient et que ça viendra.",
            "Lui promettre une promotion dès que possible pour le retenir.",
            "Ne rien dire pour éviter de créer des attentes.",
          ],
          explanation:
            "Quand la promotion verticale n'est pas possible, les voies de développement horizontales (expertise, transversal, référent, mentoring) peuvent satisfaire le besoin de progression et d'impact. Promettre sans pouvoir tenir est destructeur. Nommer honnêtement la contrainte et chercher ensemble des alternatives construit la confiance.",
        },
        {
          id: "motivation-final-q6",
          question:
            "Selon la théorie des deux facteurs de Herzberg, quelle est la distinction entre facteurs 'hygiéniques' et facteurs 'motivants' ?",
          options: [
            "Les facteurs hygiéniques évitent l'insatisfaction s'ils sont présents, mais ne créent pas de motivation ; les facteurs motivants créent de l'engagement.",
            "Les facteurs hygiéniques motivent fortement s'ils sont bons, les facteurs motivants démotivent fortement s'ils sont mauvais.",
            "Il n'y a pas de distinction : tous les facteurs contribuent également à la motivation.",
            "Les facteurs hygiéniques concernent le corps (environnement) et les facteurs motivants concernent l'esprit.",
          ],
          explanation:
            "Herzberg distingue ce qui empêche l'insatisfaction (conditions de travail, salaire, sécurité : les 'hygiènes') de ce qui crée réellement l'engagement (sens, responsabilité, accomplissement, reconnaissance). Un bon salaire ne motive pas — il évite la frustration. La motivation vient d'ailleurs.",
        },
        {
          id: "motivation-final-q7",
          question:
            "Votre équipe traverse une période difficile (surcharge, tensions). Le moral est bas. Quelle est votre première action managériale ?",
          options: [
            "Réunir l'équipe, nommer la situation, reconnaître l'effort collectif, et demander à chacun ce dont il a besoin.",
            "Organiser un team building pour changer l'ambiance.",
            "Attendre que la situation se normalise avant d'en parler.",
            "Contacter les RH pour qu'ils interviennent.",
          ],
          explanation:
            "En période difficile, nommer la réalité est le premier acte de respect. Puis reconnaître l'effort — même si les résultats sont en dessous. Puis écouter ce dont les gens ont besoin. Ce triptyque (nommer, reconnaître, écouter) est plus puissant qu'un team building qui peut sembler déplacé si la tension est forte.",
        },
        {
          id: "motivation-final-q8",
          question:
            "Quel est le signal le plus fiable qu'un collaborateur est en train de se désengager silencieusement ?",
          options: [
            "Il réduit son initiative, pose moins de questions et participe moins aux échanges informels.",
            "Il prend plus de congés que d'habitude.",
            "Il critique ouvertement les décisions de la direction.",
            "Il produit moins de résultats en termes quantitatifs.",
          ],
          explanation:
            "Le désengagement silencieux commence par le retrait : moins de questions, moins d'initiatives spontanées, moins de participation informelle. Ces signaux précèdent souvent la baisse de performance visible. Un manager attentif les capte en 1:1 ou dans les interactions du quotidien, bien avant que les chiffres ne dégradent.",
        },
      ],
    },
  ],
};
