# Posture

> Le second du manager. Une suite d'outils IA pour mieux communiquer.

Projet personnel construit pour démontrer mes compétences de Product Builder dans le cadre d'une candidature chez Jarvi (SIRH).

## Le problème

Les managers, surtout les nouveaux, sont mal outillés sur le qualitatif :
- Donner un feedback structuré et actionnable demande de la méthode (SBI, DESC) que peu connaissent
- Préparer un entretien efficace prend du temps qu'on n'a pas toujours
- Les biais (jugement de personnalité, généralisation, formulation orientée) sont fréquents

## La solution

Une suite légère qui encode les bonnes pratiques managériales dans une IA contrainte par des frameworks éprouvés. L'outil ne remplace pas le manager : il l'aide à formuler ce qu'il veut dire, et l'alerte sur ses angles morts.

### Outil 1 — Générateur de feedbacks (V1, en cours)
Décris une situation en langage naturel → reçois un feedback structuré au format SBI, adapté au ton et au canal souhaités, avec alertes sur les pièges détectés.

### Outil 2 — Générateur de questions d'entretien (V2)
Type d'entretien + contexte → guide d'entretien complet avec questions ouvertes, relances, drapeaux rouges/verts.

## Stack technique

- **Frontend** : Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend** : Routes API Next.js
- **IA** : API Anthropic, modèle Claude Sonnet 4.6
- **Auth** : NextAuth.js (Google OAuth + email/password)
- **Persistance** : Supabase (V2, pour l'historique multi-utilisateur)
- **Déploiement** : Vercel
- **Analytics** : PostHog

## Choix de design

- **Layout deux colonnes** input/output sur la même vue : pas de page de résultat séparée, on itère sans perdre le fil
- **Hiérarchie visuelle** : le contexte (travail du manager) prend la place dominante, les paramètres restent secondaires
- **Garde-fous éthiques** intégrés : l'outil détecte les jugements de personnalité dans l'input et alerte le manager
- **Pédagogie optionnelle** : la structure SBI est masquée par défaut, accessible via un dépliage pour qui veut comprendre

## Roadmap

- [x] Cadrage produit, prompt système v1
- [x] Maquettes UI (login + écran principal)
- [ ] Setup du projet Next.js
- [ ] Route API `/api/generate-feedback` avec streaming
- [ ] UI fonctionnelle (login + générateur)
- [ ] Historique local (localStorage)
- [ ] Mode itératif ("rends-le plus court", "ajoute une suggestion")
- [ ] Page Méthodologie (justification des choix produit)
- [ ] Outil 2 : générateur de questions d'entretien
- [ ] Déploiement Vercel + démo Loom

## Démarrage

```bash
npm install
cp .env.example .env.local
# Renseigner ANTHROPIC_API_KEY dans .env.local
npm run dev
```

## Structure du projet

```
manager-copilot/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx          # Page de connexion
│   ├── (app)/
│   │   └── feedback/page.tsx       # Générateur de feedbacks
│   ├── api/
│   │   └── generate-feedback/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                         # Composants shadcn
│   └── feedback/                   # Composants spécifiques
├── lib/
│   ├── prompts/
│   │   └── feedback-system.ts      # Prompt système versionné
│   ├── anthropic.ts                # Client API
│   └── types.ts                    # Types partagés
└── README.md
```
