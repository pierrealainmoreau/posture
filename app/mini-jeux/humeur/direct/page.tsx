"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RotateCcw, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { MOODS, getMoodById, getMoodImageUrl, pickRandomSet } from "@/lib/humeur/moods";

const breadcrumbs = [
  { href: "/", label: "Accueil" },
  { href: "/mini-jeux", label: "Mini-jeux" },
  { href: "/mini-jeux/humeur", label: "Humeur du jour" },
  { label: "Lancement direct" },
];

// ── Écran de résultat ─────────────────────────────────────────────────────────
function ResultScreen({
  moodId,
  setId,
  onReset,
}: {
  moodId: string;
  setId: string;
  onReset: () => void;
}) {
  const mood = getMoodById(moodId)!;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
      {/* Grande image */}
      <div className="relative w-52 h-52 rounded-3xl overflow-hidden mb-6 shadow-2xl ring-4 ring-rose-400">
        <Image
          src={getMoodImageUrl(setId, mood.index)}
          alt={mood.label}
          fill
          className="object-cover"
          sizes="208px"
          priority
        />
      </div>

      <div className="mb-10" />

      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <RotateCcw size={14} />
          Choisir à nouveau
        </button>
        <Link
          href="/mini-jeux/humeur/create"
          className="flex items-center justify-center gap-2 w-full py-3 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-colors"
        >
          <Users size={14} />
          Utiliser avec l&apos;équipe →
        </Link>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function HumeurDirectPage() {
  const [setId, setSetId]             = useState("");
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
  const [animating, setAnimating]     = useState(false);

  // Set aléatoire au montage
  useEffect(() => {
    setSetId(pickRandomSet());
  }, []);

  function handleSelect(moodId: string) {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setSelectedMoodId(moodId);
      setAnimating(false);
    }, 120);
  }

  function handleReset() {
    setAnimating(true);
    setTimeout(() => {
      setSelectedMoodId(null);
      setSetId(pickRandomSet()); // Nouveau set à chaque reset
      setAnimating(false);
    }, 120);
  }

  if (!setId) return null; // Attend le montage côté client

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />

      {selectedMoodId ? (
        <div
          className={`flex-1 flex flex-col transition-opacity duration-150 ${animating ? "opacity-0" : "opacity-100"}`}
        >
          <ResultScreen moodId={selectedMoodId} setId={setId} onReset={handleReset} />
        </div>
      ) : (
        <main
          className={`flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-8 transition-opacity duration-150 ${animating ? "opacity-0" : "opacity-100"}`}
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Comment tu te sens aujourd&apos;hui ?
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choisissez l&apos;image qui vous correspond le mieux.
            </p>
          </div>

          {/* Grille 3×3 */}
          <div className="grid grid-cols-3 gap-2">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                onClick={() => handleSelect(mood.id)}
                disabled={animating}
                className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-rose-400 hover:scale-[1.03] transition-all duration-150 active:scale-95 disabled:opacity-50 shadow-sm hover:shadow-md"
              >
                <Image
                  src={getMoodImageUrl(setId, mood.index)}
                  alt={mood.label}
                  fill
                  className="object-cover"
                  sizes="33vw"
                />
              </button>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              Vous voulez voir les humeurs de toute votre équipe ?
            </p>
            <Link
              href="/mini-jeux/humeur/create"
              className="inline-flex items-center gap-2 text-sm text-rose-500 hover:text-rose-600 font-medium transition-colors"
            >
              <Users size={14} />
              Créer une session équipe
            </Link>
          </div>
        </main>
      )}
    </div>
  );
}
