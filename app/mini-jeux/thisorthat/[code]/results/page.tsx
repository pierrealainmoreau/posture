"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, RefreshCw, LogOut, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { resolveQuestion } from "@/lib/thisorthat/questions";
import type { CustomQuestion } from "@/lib/thisorthat/questions";
import { ContinueSessionButton } from "@/components/ContinueSessionButton";
import type { ThisOrThatRoom, ThisOrThatPlayer, ThisOrThatVote } from "@/lib/thisorthat/types";

type RoomData = ThisOrThatRoom & { players: ThisOrThatPlayer[]; votes: ThisOrThatVote[] };

const GAME_LABELS: Record<string, string> = {
  thisorthat:    "This or That",
  completephrase: "Continuez la phrase",
  humeur:        "Humeur du jour",
  chaine:        "La Chaîne",
  undercover:    "Undercover",
  draw:          "Pictionary",
  code_secret:   "Code Secret",
  tribu:         "Tribu",
};

const GAME_JOIN_PATHS: Record<string, string> = {
  thisorthat:    "/mini-jeux/thisorthat/join",
  completephrase: "/mini-jeux/completephrase/join",
  humeur:        "/mini-jeux/humeur/join",
  chaine:        "/mini-jeux/chaine/join",
  undercover:    "/mini-jeux/undercover/join",
  draw:          "/mini-jeux/draw/join",
  code_secret:   "/mini-jeux/code-secret/join",
  tribu:         "/mini-jeux/tribu/join",
};

function QuestionResult({
  questionId,
  questionIndex,
  votes,
  myPlayerId,
  customQuestions,
}: {
  questionId: string;
  questionIndex: number;
  votes: ThisOrThatVote[];
  myPlayerId: string;
  customQuestions: CustomQuestion[];
}) {
  const question = resolveQuestion(questionId, customQuestions);
  if (!question) return null;

  const qVotes = votes.filter((v) => v.question_index === questionIndex);
  const aCount = qVotes.filter((v) => v.choice === "a").length;
  const bCount = qVotes.filter((v) => v.choice === "b").length;
  const total  = aCount + bCount;
  const pctA   = total === 0 ? 50 : Math.round((aCount / total) * 100);
  const pctB   = 100 - pctA;
  const myVote = qVotes.find((v) => v.player_id === myPlayerId)?.choice ?? null;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
          {question.context}
        </span>
        {myVote && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            myVote === "a"
              ? "bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400"
              : "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
          }`}>
            {myVote === "a" ? question.a : question.b}
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        {question.a} ou {question.b} ?
      </p>
      <div className="flex rounded-xl overflow-hidden h-8 text-xs font-bold mb-2">
        <div
          className="flex items-center justify-center text-white bg-sky-500 transition-all duration-500"
          style={{ width: `${pctA}%`, minWidth: pctA > 0 ? "1.5rem" : 0 }}
        >
          {pctA > 20 && `${pctA}%`}
        </div>
        <div
          className="flex items-center justify-center text-white bg-indigo-500 transition-all duration-500"
          style={{ width: `${pctB}%`, minWidth: pctB > 0 ? "1.5rem" : 0 }}
        >
          {pctB > 20 && `${pctB}%`}
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
          {question.a} ({aCount})
        </span>
        <span className="flex items-center gap-1">
          ({bCount}) {question.b}
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
        </span>
      </div>
    </div>
  );
}

export default function ThisOrThatResultsPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]   = useState("");
  const [room, setRoom]           = useState<RoomData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [nextGame, setNextGame]   = useState<{ type: string; code: string } | null>(null);
  const pollRef                   = useRef<ReturnType<typeof setInterval> | null>(null);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/mini-jeux", label: "Mini-jeux" },
    { href: "/mini-jeux/thisorthat", label: "This or That" },
    { label: "Résultats" },
  ];

  useEffect(() => {
    const stored = localStorage.getItem(`thisorthat_player_${upperCode}`);
    if (stored) {
      try {
        const { playerId: pid } = JSON.parse(stored) as { playerId: string };
        setPlayerId(pid);
      } catch { /* ignore */ }
    }
  }, [upperCode]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/thisorthat/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as RoomData;
      if (data.status === "lobby") { router.replace(`/mini-jeux/thisorthat/${upperCode}/lobby`); return; }
      if (data.status === "playing") { router.replace(`/mini-jeux/thisorthat/${upperCode}/play`); return; }

      setRoom(data);
      setLoading(false);

      if (data.next_game_type && data.next_game_code) {
        setNextGame({ type: data.next_game_type, code: data.next_game_code });
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // Polling léger pour détecter quand l'hôte lance un prochain jeu
  useEffect(() => {
    if (loading) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/thisorthat/room/${upperCode}/next-game`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store" },
        });
        if (!res.ok) return;
        const data = await res.json() as { next_game_type: string | null; next_game_code: string | null };
        if (data.next_game_type && data.next_game_code) {
          setNextGame({ type: data.next_game_type, code: data.next_game_code });
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch { /* ignore */ }
    }, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loading, upperCode]);

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
      </div>
    );
  }

  const isHost = room.host_player_id === playerId;
  const nextGameLabel = nextGame ? (GAME_LABELS[nextGame.type] ?? nextGame.type) : null;
  const nextGameJoinPath = nextGame ? (GAME_JOIN_PATHS[nextGame.type] ?? null) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">This or That</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {room.players.length} participant{room.players.length !== 1 ? "s" : ""} · {room.question_ids.length} questions
          </p>
        </div>

        {/* Notification prochain jeu — visible par tous */}
        {nextGame && nextGameLabel && nextGameJoinPath && (
          <div className="mb-6 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-0.5">
                {isHost ? "Prochain jeu lancé" : "L'hôte a lancé le prochain jeu"}
              </p>
              <p className="text-sm font-bold text-violet-900 dark:text-violet-100">{nextGameLabel}</p>
            </div>
            {!isHost && (
              <Link
                href={`${nextGameJoinPath}?code=${nextGame.code}`}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors"
              >
                Rejoindre
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        )}

        <div className="space-y-3 mb-8">
          {room.question_ids.map((qId, i) => (
            <QuestionResult
              key={qId}
              questionId={qId}
              questionIndex={i}
              votes={room.votes}
              myPlayerId={playerId}
              customQuestions={room.custom_questions ?? []}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <ContinueSessionButton gameType="thisorthat" roomCode={upperCode} />
          {isHost ? (
            <>
              <Link
                href="/mini-jeux/thisorthat/create"
                className="flex items-center justify-center gap-2 py-3 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors"
              >
                <Plus size={14} />
                Nouvelle partie
              </Link>
              <Link
                href={`/mini-jeux?fromGame=thisorthat&fromCode=${upperCode}`}
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
              onClick={() => {
                localStorage.removeItem(`thisorthat_player_${upperCode}`);
                window.close();
              }}
              className="flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut size={14} />
              Fermer la session
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
