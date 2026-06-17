import type { ProfilId } from './profiles';

export function getTeamInsight(dominant: ProfilId, absent: ProfilId[]): string {
  // Check specific dominant + absent combinations first
  if (dominant === 'pilote' && absent.includes('repere')) {
    return "Beaucoup d'action, peu de structure. Créer des temps de cadrage.";
  }
  if (dominant === 'dynamo' && absent.includes('socle')) {
    return "Créativité et décision présentes. L'écoute mutuelle sera la clé.";
  }
  if (dominant === 'repere' && absent.includes('dynamo')) {
    return "La rigueur est là. Osez l'expérimentation et l'improvisation.";
  }

  // Check absent profiles
  if (absent.includes('pilote')) {
    return "Personne ne se positionne naturellement en leader de décision. À anticiper sur les projets.";
  }
  if (absent.includes('dynamo')) {
    return "L'équipe est solide et structurée. Pensez à injecter de la créativité et de l'élan.";
  }
  if (absent.includes('socle')) {
    return "L'équipe avance vite et pense loin. Veillez à ne laisser personne derrière.";
  }
  if (absent.includes('repere')) {
    return "L'équipe va vite — pensez à intégrer des moments de relecture et de cadrage.";
  }

  // Check dominant profile (no absent)
  if (dominant === 'pilote') {
    return "Une équipe qui avance vite. Veillez à embarquer tout le monde dans le mouvement.";
  }
  if (dominant === 'dynamo') {
    return "Beaucoup d'idées et d'énergie. La prochaine étape : structurer pour concrétiser.";
  }
  if (dominant === 'socle') {
    return "Une équipe soudée et fiable. Elle gagnera à se donner permission d'accélérer.";
  }
  if (dominant === 'repere') {
    return "Rigueur et qualité au cœur. Laissez aussi de la place à l'expérimentation rapide.";
  }

  // Fallback: balanced distribution
  return "Un équilibre rare. Chaque style est représenté : la diversité est une force à activer.";
}
