import Link from "next/link";
import { Zap, PenLine, ThumbsUp, BarChart2 } from "lucide-react";
import { Header } from "@/components/Header";

export default function SpeedRetroHubPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/reunion-maker" currentTool="Speed Retro" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950 rounded-2xl flex items-center justify-center mb-4">
            <Zap size={22} className="text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Speed Retro
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            4 questions, 20 min, une équipe alignée.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
            Règles du jeu
          </h2>
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-7 h-7 bg-orange-50 dark:bg-orange-950 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <PenLine size={14} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Écriture — 5 min
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Chaque participant répond librement aux 4 questions en silence.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-7 h-7 bg-orange-50 dark:bg-orange-950 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <ThumbsUp size={14} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Vote — 3 min
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Toutes les réponses sont anonymes. Votez pour les idées qui résonnent le plus.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-7 h-7 bg-orange-50 dark:bg-orange-950 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <BarChart2 size={14} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Résultats
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Les idées les plus votées émergent pour guider la discussion d&apos;équipe.
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className="flex gap-3">
          <Link
            href="/mini-jeux/speed-retro/join"
            className="flex-1 inline-flex items-center justify-center py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Rejoindre
          </Link>
          <Link
            href="/mini-jeux/speed-retro/create"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 transition-colors"
          >
            <Zap size={15} />
            Créer une session
          </Link>
        </div>
      </main>
    </div>
  );
}
