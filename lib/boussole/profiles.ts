export type ProfilId = 'pilote' | 'dynamo' | 'socle' | 'repere';

export type BoussoleProfil = {
  id: ProfilId;
  name: string;
  color: string;
  emoji: string;
  tagline: string;
  forces: string[];
  vigilances: string[];
  collaboreAvec: string;
};

export const PROFILS: Record<ProfilId, BoussoleProfil> = {
  pilote: {
    id: 'pilote',
    name: 'Le Pilote',
    color: '#E85D4A',
    emoji: '🔴',
    tagline: 'Décide vite, avance toujours',
    forces: ['Prise de décision rapide', 'Orientation résultats', 'Leadership naturel'],
    vigilances: ["Peut aller trop vite pour l'équipe", 'Gagne à consulter avant de trancher'],
    collaboreAvec: "Apporte l'élan que Le Socle sécurise et que Le Repère structure",
  },
  dynamo: {
    id: 'dynamo',
    name: 'Le Dynamo',
    color: '#F5C842',
    emoji: '🟡',
    tagline: "L'énergie qui met le groupe en mouvement",
    forces: ['Enthousiasme communicatif', 'Créativité', 'Capacité à fédérer'],
    vigilances: ["Peut disperser l'énergie", "Gagne à finir ce qu'il commence"],
    collaboreAvec: "Inspire là où Le Repère analyse et Le Pilote décide",
  },
  socle: {
    id: 'socle',
    name: 'Le Socle',
    color: '#4CAF82',
    emoji: '🟢',
    tagline: 'La fiabilité sur laquelle on peut compter',
    forces: ['Écoute active', 'Constance', "Sens de l'équipe"],
    vigilances: ['Peut éviter les conflits nécessaires', 'Gagne à exprimer ses désaccords'],
    collaboreAvec: "Stabilise ce que Le Pilote lance et ce que Le Dynamo emballe",
  },
  repere: {
    id: 'repere',
    name: 'Le Repère',
    color: '#4A90D9',
    emoji: '🔵',
    tagline: 'La rigueur qui évite les erreurs coûteuses',
    forces: ['Analyse fine', 'Souci du détail', 'Fiabilité des livrables'],
    vigilances: ["Peut sur-analyser avant d'agir", "Gagne à accepter l'imperfection nécessaire"],
    collaboreAvec: "Cadre ce que Le Dynamo génère et ce que Le Pilote impulse",
  },
};

export const PROFIL_ORDER: ProfilId[] = ['pilote', 'dynamo', 'socle', 'repere'];
