"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, RefreshCw, LogOut } from "lucide-react";
import { Header } from "@/components/Header";
import { POST_IT_COLORS } from "@/lib/completephrase/starters";
import { ContinueSessionButton } from "@/components/ContinueSessionButton";
import type { CompletePhraseRoom, CompletePhrasePlayer } from "@/lib/completephrase/types";

type RoomData = CompletePhraseRoom & { players: CompletePhrasePlayer[] };

function PostIt({
  text,
  pseudo,
  avatarColor,
  starterPhrase,
  colorClass,
  index,
  visible,
}: {
  text: string;
  pseudo: string;
  avatarColor: string;
  starterPhrase: string;
  colorClass: string;
  index: number;
  visible: boolean;
}) {
  return (
    <div
      className={`transition-all duration-500 ${
        visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
      }`}
      style={{ transitionDelay: visible ? `${index * 120}ms` : "0ms" }}
    >
      <div className={`rounded-2xl border p-4 shadow-sm ${colorClass}`}>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-tight">{starterPhrase}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug mb-3">{text}</p>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: avatarColor }} />
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{pseudo}</span>
        </div>
      </div>
    </div>
  );
}

export default function CompletePhraseResultsPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]           = useState("");
  const [room, setRoom]                   = useState<RoomData | null>(null);
  const [loading, setLoading]             = useState(true);
  const [revealedCount, setRevealedCount] = useState(0);
  const [allRevealed, setAllRevealed]     = useState(false);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/mini-jeux", label: "Mini-jeux" },
    { href: "/mini-jeux/completephrase", label: "Continuez la phrase" },
    { label: "Résultats" },
  ];

  useEffect(() => {
    const stored = localStorage.getItem(`completephrase_player_${upperCode}`);
    if (stored) {
      try {
        const { playerId: pid } = JSON.parse(stored) as { playerId: string };
        setPlayerId(pid);
      } catch { /* ignore */ }
    }
  }, [upperCode]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/completephrase/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as RoomData;
      if (data.status === "lobby") { router.replace(`/mini-jeux/completephrase/${upperCode}/lobby`); return; }
      if (data.status === "playing") { router.replace(`/mini-jeux/completephrase/${upperCode}/play`); return; }

      setRoom(data);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // Compte total de post-its à révéler
  const totalPostIts = room
    ? (() => {
        const phrases = (room.starter_phrases as string[] | null) ?? [room.starter_phrase];
        return room.players.reduce((sum, p) => {
          const resps = (p.responses as (string | null)[] | null) ?? (p.response ? [p.response] : []);
          return sum + resps.filter((r, i) => i < phrases.length && r != null && r !== "").length;
        }, 0);
      })()
    : 0;

  useEffect(() => {
    if (loading || !room || totalPostIts === 0) { setAllRevealed(true); return; }
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setRevealedCount(i);
      if (i >= totalPostIts) { setAllRevealed(true); clearInterval(timer); }
    }, 150);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
      </div>
    );
  }

  const isHost = room.host_player_id === playerId;
  const phrases = (room.starter_phrases as string[] | null) ?? [room.starter_phrase];
  const totalPlayers = room.players.length;

  // Construit les sections : une par phrase
  type PhraseSection = { phrase: string; entries: { text: string; pseudo: string; avatarColor: string }[] };
  const sections: PhraseSection[] = phrases.map((phrase) => ({
    phrase,
    entries: [],
  }));

  let globalIndex = 0;
  room.players.forEach((player) => {
    const resps = (player.responses as (string | null)[] | null) ?? (player.response ? [player.response] : []);
    phrases.forEach((_, i) => {
      if (resps[i] != null && resps[i] !== "") {
        sections[i].entries.push({
          text: resps[i]!,
          pseudo: player.pseudo,
          avatarColor: player.avatar_color,
        });
      }
    });
  });

  // Calcule l'index global de chaque post-it pour l'animation staggerée
  const renderSections = sections.map((section) => {
    const itemsWithIndex = section.entries.map((entry) => ({ ...entry, globalIdx: globalIndex++ }));
    return { ...section, itemsWithIndex };
  });

  const respondentCount = sections.reduce((s, sec) => s + sec.entries.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">

        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mur de réponses</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {respondentCount} réponse{respondentCount !== 1 ? "s" : ""} · {totalPlayers} participant{totalPlayers !== 1 ? "s" : ""} · {phrases.length} phrase{phrases.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Sections par phrase */}
        <div className="space-y-10 mb-10">
          {renderSections.map((section, si) => (
            <div key={si}>
              {/* En-tête de section */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-fuchsia-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {si + 1}
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {section.phrase} <span className="text-fuchsia-400 font-normal">_____</span>
                </p>
              </div>

              {section.itemsWithIndex.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic pl-9">
                  Aucune réponse pour cette phrase.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-9">
                  {section.itemsWithIndex.map((item) => (
                    <PostIt
                      key={`${si}-${item.pseudo}`}
                      text={item.text}
                      pseudo={item.pseudo}
                      avatarColor={item.avatarColor}
                      starterPhrase={section.phrase}
                      colorClass={POST_IT_COLORS[item.globalIdx % POST_IT_COLORS.length]}
                      index={item.globalIdx}
                      visible={item.globalIdx < revealedCount}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {allRevealed && (
          <div className="flex flex-col gap-3">
            <ContinueSessionButton gameType="completephrase" roomCode={upperCode} />
            {isHost ? (
              <>
                <Link
                  href="/mini-jeux/completephrase/create"
                  className="flex items-center justify-center gap-2 py-3 bg-fuchsia-500 text-white text-sm font-semibold rounded-xl hover:bg-fuchsia-600 transition-colors"
                >
                  <Plus size={14} />
                  Nouvelle session
                </Link>
                <Link
                  href="/mini-jeux"
                  className="flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <RefreshCw size={14} />
                  Autres mini-jeux
                </Link>
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 py-3 text-gray-400 dark:text-gray-500 text-sm rounded-xl hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  <LogOut size={14} />
                  Quitter
                </Link>
              </>
            ) : (
              <button
                onClick={() => { localStorage.removeItem(`completephrase_player_${upperCode}`); window.close(); }}
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <LogOut size={14} />
                Fermer la session
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
