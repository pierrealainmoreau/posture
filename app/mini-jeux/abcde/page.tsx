import Link from "next/link";
import { Brain, LogIn, Plus } from "lucide-react";
import { Header } from "@/components/Header";

const STEPS = [
  { letter: "A", label: "Analyser",     color: "bg-blue-100  text-blue-700  dark:bg-blue-900/40  dark:text-blue-300"  },
  { letter: "B", label: "Brainstormer", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  { letter: "C", label: "Choisir",      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { letter: "D", label: "Décider",      color: "bg-red-100   text-red-700   dark:bg-red-900/40   dark:text-red-300"   },
  { letter: "E", label: "Évaluer",      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
];

const breadcrumbs = [
  { href: "/", label: "Accueil" },
  { href: "/reunion-maker", label: "Réunion Maker" },
  { label: "Méthode ABCDE" },
];

export default function AbcdeLandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-10">

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center">
            <Brain size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Méthode ABCDE</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Atelier collaboratif de prise de décision — 5 étapes structurées, tous les participants contribuent.
        </p>

        {/* Step pills */}
        <div className="flex gap-2 flex-wrap mb-8">
          {STEPS.map((s) => (
            <span key={s.letter} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${s.color}`}>
              <span className="font-bold">{s.letter}</span>
              <span className="font-normal opacity-80">{s.label}</span>
            </span>
          ))}
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <span className="font-semibold">Comment ça marche :</span> L&apos;animateur crée la session avec un sujet de travail. Les participants rejoignent via un code. Ensemble, le groupe progresse à travers les 5 étapes — avec des templates pour guider chaque phase.
          </p>
          <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1.5">
            <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-400">•</span>Post-its collaboratifs en temps réel (A &amp; B)</li>
            <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-400">•</span>Vote à points pour sélectionner les meilleures idées (C)</li>
            <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-400">•</span>Synthèse IA générée à la fin du processus</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/mini-jeux/abcde/create"
            className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            Créer une session
          </Link>
          <Link
            href="/mini-jeux/abcde/join"
            className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <LogIn size={16} />
            Rejoindre une session
          </Link>
        </div>
      </main>
    </div>
  );
}
