import Link from "next/link";
import { Header } from "@/components/Header";
import { ROTI_LABELS } from "@/lib/roti/types";

const breadcrumbs = [
  { href: "/", label: "Accueil" },
  { href: "/reunion-maker", label: "Réunion Maker" },
  { label: "ROTI" },
];

export default function RotiHomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} currentTool="ROTI" />

      <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">ROTI</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Évaluez votre réunion en 30 secondes.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
            Échelle de notation
          </p>
          <div className="space-y-2">
            {([1, 2, 3, 4, 5] as const).map((score) => {
              const l = ROTI_LABELS[score];
              return (
                <div
                  key={score}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${l.bgClass} border ${l.borderClass}`}
                >
                  <span className={`text-lg font-bold ${l.textClass} w-5 text-center`}>
                    {score}
                  </span>
                  <span className={`text-sm font-medium ${l.textClass}`}>{l.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/mini-jeux/roti/create"
            className="w-full py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors text-center"
          >
            Créer une session
          </Link>
          <Link
            href="/mini-jeux/roti/join"
            className="w-full py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:border-violet-300 dark:hover:border-violet-700 transition-colors text-center"
          >
            Rejoindre
          </Link>
        </div>
      </main>
    </div>
  );
}
