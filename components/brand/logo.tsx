import { cn } from "@/lib/utils";

interface LogoProps {
  /** Affiche le wordmark "posture" à droite du glyph */
  withWordmark?: boolean;
  /** Taille du glyph en pixels. Défaut : 24 */
  size?: number;
  className?: string;
}

/**
 * Logo Posture.
 * Glyph : cercle ouvert + point central (le pivot).
 * Le glyph seul sert de favicon, d'avatar Slack et d'icône dans les headers.
 * Avec wordmark, il sert dans les contextes de marque (login, footer, doc).
 */
export function Logo({ withWordmark = false, size = 24, className }: LogoProps) {
  const strokeWidth = size / 10;
  const dotRadius = size / 8;
  const circleRadius = (size - strokeWidth) / 2;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={withWordmark ? "true" : undefined}
        aria-label={withWordmark ? undefined : "Posture"}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={circleRadius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={dotRadius}
          fill="currentColor"
        />
      </svg>
      {withWordmark && (
        <span className="text-[15px] font-medium tracking-tight">posture</span>
      )}
    </span>
  );
}
