"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import Link from "next/link";

const BETA_END = new Date(2026, 7, 31, 23, 59, 59).getTime();

function getRemaining() {
  const diff = Math.max(0, BETA_END - Date.now());
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function BetaReferralBanner() {
  const [time, setTime] = useState(getRemaining);

  useEffect(() => {
    const id = setInterval(() => setTime(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-blue-600 text-white">
      <div className="max-w-5xl mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">
          Invitez des managers et profitez de 3 mois gratuits lors du lancement de l&apos;outil
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs font-mono tabular-nums text-blue-100">
            Fin de la Bêta dans {time.days}j {time.hours}h {time.minutes}m {time.seconds}s
          </span>
          <Link
            href="/referral"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Share2 size={13} />
            Partager
          </Link>
        </div>
      </div>
    </div>
  );
}
