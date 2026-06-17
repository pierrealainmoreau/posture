import type { IcebreakerQuestion } from "@/lib/types";

export const ICEBREAKER_QUESTIONS: IcebreakerQuestion[] = [
  // ===== Identité =====
  { id: "id-01", question: "Si vous étiez un objet qu'on trouve dans une boîte à outils, lequel seriez-vous ?", category: "identity" },
  { id: "id-02", question: "Quel super-pouvoir vous décrirait le mieux au travail ?", category: "identity" },
  { id: "id-03", question: "Si votre semaine était un type de météo, lequel serait-il cette semaine ?", category: "identity" },
  { id: "id-04", question: "Quel emoji vous représente le mieux aujourd'hui, et pourquoi ?", category: "identity" },
  { id: "id-05", question: "Quel personnage de fiction partage votre énergie au travail ?", category: "identity" },
  { id: "an-03", question: "Un petit truc qui a illuminé votre semaine, même minuscule ?", category: "identity" },

  // ===== Préférences =====
  { id: "pr-01", question: "Si vous étiez une application, laquelle seriez-vous ?", category: "preferences" },
  { id: "pr-02", question: "Plutôt deep work en silence ou musique à fond ?", category: "preferences" },
  { id: "pr-03", question: "Une boisson qui vous met instantanément de bonne humeur ?", category: "preferences" },
  { id: "pr-04", question: "Réunion debout ou réunion assise, et pourquoi ?", category: "preferences" },
  { id: "pr-05", question: "Quelle est votre routine non-négociable du matin ?", category: "preferences" },

  // ===== Vision =====
  { id: "vi-01", question: "Si vous aviez un an de congé payé, vous feriez quoi en premier ?", category: "vision" },
  { id: "vi-02", question: "Une compétence que vous aimeriez avoir d'ici 5 ans ?", category: "vision" },
  { id: "vi-03", question: "Une innovation qui vous rendrait dingue de joie si elle existait demain ?", category: "vision" },
  { id: "vi-04", question: "Si vous deviez monter votre boîte demain, ce serait sur quel sujet ?", category: "vision" },
  { id: "vi-05", question: "Dans 10 ans, qu'est-ce que vous aimeriez avoir arrêté de faire ?", category: "vision" },
  { id: "an-02", question: "Quelle est la chose la plus inattendue que vous avez apprise ce mois-ci ?", category: "vision" },

  // ===== Décalé =====
  { id: "of-01", question: "Vous gagnez un dîner avec une personne, vivante ou non. C'est qui ?", category: "offbeat" },
  { id: "of-02", question: "Si votre boîte mail avait un thème musical, ce serait lequel ?", category: "offbeat" },
  { id: "of-03", question: "Vous devez expliquer votre métier à un enfant de 6 ans. Comment ?", category: "offbeat" },
  { id: "of-04", question: "Un objet inutile mais que vous adorez ?", category: "offbeat" },
  { id: "of-05", question: "Si vous étiez un raccourci clavier, lequel seriez-vous ?", category: "offbeat" },
  { id: "an-01", question: "Racontez la dernière fois que vous avez ri seul devant votre écran.", category: "offbeat" },
  { id: "an-05", question: "Le pire conseil professionnel qu'on vous ait jamais donné ?", category: "offbeat" },

  // ===== Surprise =====
  { id: "su-01", question: "Quel est le compliment qui vous a le plus marqué dans votre vie pro ?", category: "surprise" },
  { id: "su-02", question: "Une habitude que vous avez piquée à un collègue et que vous gardez ?", category: "surprise" },
  { id: "su-03", question: "Si l'équipe devait choisir un nom de groupe de rock, ce serait quoi ?", category: "surprise" },
  { id: "su-04", question: "Une chanson qui vous met en mode focus instantanément ?", category: "surprise" },
  { id: "su-05", question: "Quel est le rituel d'équipe que vous aimeriez instaurer cette année ?", category: "surprise" },
  { id: "an-04", question: "Une victoire dont vous êtes fier mais que personne ne connaît dans l'équipe ?", category: "surprise" },
];
