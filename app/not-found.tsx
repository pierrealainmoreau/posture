import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <span className="text-3xl">🗺️</span>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500 mb-2">
          Erreur 404
        </p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Page introuvable
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          Cette page n&apos;existe pas ou a été déplacée. Revenez à l&apos;accueil pour retrouver tous les outils.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          <Home className="w-4 h-4" />
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
