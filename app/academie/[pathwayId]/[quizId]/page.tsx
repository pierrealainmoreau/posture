"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  Lock,
} from "lucide-react";
import { Header } from "@/components/Header";
import { getPathway, getQuiz } from "@/lib/academie/pathways/index";
import { recordQuizAttempt, awardBadge, loadProgress, migrateFromLocalStorage } from "@/lib/academie/storage";
import { computePathwayStatus, isPathwayCompleted } from "@/lib/academie/progress";
import { createClient } from "@/lib/supabase/client";
import { shuffle } from "@/lib/quiz/shuffle";
import { ACADEMIE_CONFIG } from "@/lib/types";
import type { AcademieProgress, AcademieQuestion, BadgeTier } from "@/lib/types";

// ─── Types locaux ─────────────────────────────────────────────────────────────

type GameState = "intro" | "playing" | "finished";

interface QuizAnswer {
  questionIndex: number;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<BadgeTier, { label: string; color: string }> = {
  bronze: { label: "Bronze", color: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
  silver: { label: "Argent", color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700" },
  gold: { label: "Or", color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800" },
  final: { label: "Final", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
};

// ─── Timer bar ────────────────────────────────────────────────────────────────

function TimerBar({ totalMs, remainingMs }: { totalMs: number; remainingMs: number }) {
  const pct = Math.max(0, (remainingMs / totalMs) * 100);
  const isUrgent = remainingMs <= 5000;
  return (
    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-100 ${isUrgent ? "bg-red-500" : "bg-blue-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Écran intro ──────────────────────────────────────────────────────────────

function IntroScreen({
  quizTitle,
  quizDescription,
  tier,
  questionCount,
  onStart,
  pathwayId,
  pathwayTitle,
}: {
  quizTitle: string;
  quizDescription: string;
  tier: BadgeTier;
  questionCount: number;
  onStart: () => void;
  pathwayId: string;
  pathwayTitle: string;
}) {
  const tierConf = TIER_CONFIG[tier];
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 px-4 text-center max-w-lg mx-auto">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mb-6 ${tierConf.color}`}>
        Niveau {tierConf.label}
      </span>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
        {quizTitle}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        {quizDescription}
      </p>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-8 text-left w-full space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Questions</span>
          <span className="font-medium text-gray-900 dark:text-white">{questionCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Temps par question</span>
          <span className="font-medium text-gray-900 dark:text-white">{ACADEMIE_CONFIG.timerSeconds} secondes</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Score minimum</span>
          <span className="font-medium text-gray-900 dark:text-white">{ACADEMIE_CONFIG.passingScorePercent} %</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Parcours</span>
          <span className="font-medium text-gray-900 dark:text-white">{pathwayTitle}</span>
        </div>
      </div>

      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 bg-blue-700 text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
      >
        Commencer
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Écran quiz ───────────────────────────────────────────────────────────────

function PlayingScreen({
  questions,
  shuffledOptions,
  currentIndex,
  remainingMs,
  answered,
  onAnswer,
}: {
  questions: AcademieQuestion[];
  shuffledOptions: string[][];
  currentIndex: number;
  remainingMs: number;
  answered: boolean;
  onAnswer: (index: number) => void;
}) {
  const q = questions[currentIndex];
  const opts = shuffledOptions[currentIndex];
  const totalMs = ACADEMIE_CONFIG.timerSeconds * 1000;
  const secondsLeft = Math.ceil(remainingMs / 1000);

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Question {currentIndex + 1} / {questions.length}
        </span>
        <span className={`flex items-center gap-1 text-xs font-medium tabular-nums ${remainingMs <= 5000 ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
          <Clock className="h-3 w-3" />
          {secondsLeft}s
        </span>
      </div>
      <TimerBar totalMs={totalMs} remainingMs={remainingMs} />

      <p className="text-lg font-semibold text-gray-900 dark:text-white leading-snug mt-8 mb-6">
        {q.question}
      </p>

      <div className="space-y-3">
        {opts.map((opt, i) => (
          <button
            key={i}
            disabled={answered}
            onClick={() => onAnswer(i)}
            className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Écran résultats ──────────────────────────────────────────────────────────

function FinishedScreen({
  questions,
  shuffledOptions,
  shuffledOrders,
  answers,
  passed,
  badgeJustEarned,
  badgeName,
  nextQuizId,
  pathwayId,
  onRetry,
}: {
  questions: AcademieQuestion[];
  shuffledOptions: string[][];
  shuffledOrders: number[][];
  answers: QuizAnswer[];
  passed: boolean;
  badgeJustEarned: boolean;
  badgeName: string;
  nextQuizId: string | null;
  pathwayId: string;
  onRetry: () => void;
}) {
  const score = answers.filter((a) => a.isCorrect).length;
  const total = questions.length;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
      {/* Score */}
      <div className="text-center mb-6">
        <p className="text-6xl font-bold text-gray-900 dark:text-white mb-2 tabular-nums">
          {score}
          <span className="text-3xl text-gray-400 dark:text-gray-500 font-normal">/{total}</span>
        </p>
        {passed ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4" />
            Validé !
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Encore un effort
          </span>
        )}
      </div>

      {/* Badge gagné */}
      {badgeJustEarned && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center flex-shrink-0">
            <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
              Badge débloqué : {badgeName}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Félicitations, vous avez complété ce parcours !
            </p>
          </div>
        </div>
      )}

      {/* Révision des questions */}
      <div className="space-y-4 mb-8">
        {questions.map((q, qi) => {
          const answer = answers[qi];
          const opts = shuffledOrders[qi].map((i) => q.options[i]);
          const isTimeout = answer.selectedIndex === -1;
          const isCorrect = answer.isCorrect;

          return (
            <div key={q.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="flex-shrink-0 mt-0.5">
                  {isTimeout ? (
                    <Clock className="h-[18px] w-[18px] text-amber-500" />
                  ) : isCorrect ? (
                    <CheckCircle2 className="h-[18px] w-[18px] text-green-500" />
                  ) : (
                    <XCircle className="h-[18px] w-[18px] text-red-500" />
                  )}
                </span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                  {q.question}
                </p>
              </div>

              <div className="space-y-1.5 mb-3 ml-7">
                {opts.map((opt, oi) => {
                  const isChosen = oi === answer.selectedIndex;
                  const isCorrectOpt = oi === answer.correctIndex;
                  let cls = "px-3 py-2 rounded-lg text-xs border ";
                  if (isCorrectOpt) {
                    cls += "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-200 font-medium";
                  } else if (isChosen && !isCorrectOpt) {
                    cls += "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 line-through";
                  } else {
                    cls += "border-transparent text-gray-400 dark:text-gray-600";
                  }
                  return (
                    <div key={oi} className={cls}>
                      {isCorrectOpt && <span className="mr-1 text-green-600 dark:text-green-400">✓</span>}
                      {isChosen && !isCorrectOpt && !isTimeout && <span className="mr-1 text-red-500">✗</span>}
                      {opt}
                    </div>
                  );
                })}
                {isTimeout && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Temps écoulé — question passée automatiquement
                  </p>
                )}
              </div>

              <div className="ml-7 border-l-2 border-blue-100 dark:border-blue-900 pl-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {q.explanation}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRetry}
          className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Refaire le quiz
        </button>
        {nextQuizId && passed && (
          <Link
            href={`/academie/${pathwayId}/${nextQuizId}`}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-800 transition-colors"
          >
            Quiz suivant
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
        <Link
          href={`/academie/${pathwayId}`}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour au parcours
        </Link>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const pathwayId = params.pathwayId as string;
  const quizId = params.quizId as string;

  const pathway = getPathway(pathwayId);
  const quiz = getQuiz(pathwayId, quizId);

  const [userId, setUserId] = useState<string | null>(null);
  const [progress, setProgress] = useState<AcademieProgress>({ pathways: {}, badges_earned: [] });
  const [gameState, setGameState] = useState<GameState>("intro");
  const [questions, setQuestions] = useState<AcademieQuestion[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<string[][]>([]);
  const [shuffledOrders, setShuffledOrders] = useState<number[][]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [answered, setAnswered] = useState(false);
  const [remainingMs, setRemainingMs] = useState(ACADEMIE_CONFIG.timerSeconds * 1000);
  const [passed, setPassed] = useState(false);
  const [badgeJustEarned, setBadgeJustEarned] = useState(false);
  const [nextQuizId, setNextQuizId] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Récupérer le userId, migrer depuis localStorage, charger la progression Supabase
  useEffect(() => {
    if (!pathway || !quiz) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      await migrateFromLocalStorage(user.id);
      const prog = await loadProgress(user.id);
      setProgress(prog);
      const statuses = computePathwayStatus(pathway, prog);
      const quizIndex = pathway.quizzes.findIndex((q) => q.id === quizId);
      if (quizIndex !== -1 && statuses[quizIndex].locked) {
        router.replace(`/academie/${pathwayId}`);
      }
    });
  }, [pathway, quiz, quizId, pathwayId, router]);

  const startSession = useCallback(() => {
    if (!quiz) return;
    const orders: number[][] = quiz.questions.map(() => {
      const order = shuffle([0, 1, 2, 3]);
      return order;
    });
    const opts: string[][] = quiz.questions.map((q, qi) =>
      orders[qi].map((idx) => q.options[idx]),
    );
    setQuestions(quiz.questions);
    setShuffledOrders(orders);
    setShuffledOptions(opts);
    setCurrentIndex(0);
    setAnswers([]);
    setAnswered(false);
    setRemainingMs(ACADEMIE_CONFIG.timerSeconds * 1000);
    setBadgeJustEarned(false);
    setGameState("playing");
  }, [quiz]);

  // Timer
  useEffect(() => {
    if (gameState !== "playing") return;
    intervalRef.current = setInterval(() => {
      setRemainingMs((prev) => (prev <= 100 ? 0 : prev - 100));
    }, 100);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [gameState, currentIndex]);

  // Timeout automatique
  useEffect(() => {
    if (gameState !== "playing" || answered) return;
    if (remainingMs === 0) handleAnswer(-1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs, answered, gameState]);

  const handleAnswer = useCallback(
    (selectedIndex: number) => {
      if (answered || !quiz) return;
      setAnswered(true);
      if (intervalRef.current) clearInterval(intervalRef.current);

      const order = shuffledOrders[currentIndex];
      const correctIndex = order.indexOf(0);
      const isCorrect = selectedIndex !== -1 && selectedIndex === correctIndex;

      const newAnswer: QuizAnswer = { questionIndex: currentIndex, selectedIndex, correctIndex, isCorrect };
      const newAnswers = [...answers, newAnswer];

      setTimeout(() => {
        if (currentIndex + 1 >= questions.length) {
          // Fin du quiz
          const score = newAnswers.filter((a) => a.isCorrect).length;
          const total = questions.length;
          const quizPassed = (score / total) * 100 >= ACADEMIE_CONFIG.passingScorePercent;
          setPassed(quizPassed);
          setAnswers(newAnswers);
          setGameState("finished");

          // Persistance Supabase (fire-and-forget — ne bloque pas l'affichage)
          const uid = userId ?? "anonymous";
          recordQuizAttempt(pathwayId, quizId, score, total, quizPassed, uid, progress)
            .then(async (updated) => {
              setProgress(updated);

              // Badge ?
              if (pathway && isPathwayCompleted(pathway, updated)) {
                const withBadge = await awardBadge(updated, pathwayId, uid);
                setProgress(withBadge);
                setBadgeJustEarned(true);
              }

              // Quiz suivant
              if (pathway && quizPassed) {
                const currentQuizIndex = pathway.quizzes.findIndex((q) => q.id === quizId);
                const nextStatuses = computePathwayStatus(pathway, updated);
                const next = pathway.quizzes[currentQuizIndex + 1];
                if (next && !nextStatuses[currentQuizIndex + 1]?.locked) {
                  setNextQuizId(next.id);
                }
              }
            })
            .catch(console.error);
        } else {
          setAnswers(newAnswers);
          setCurrentIndex((i) => i + 1);
          setAnswered(false);
          setRemainingMs(ACADEMIE_CONFIG.timerSeconds * 1000);
        }
      }, 300);
    },
    [answered, quiz, shuffledOrders, currentIndex, answers, questions, pathwayId, quizId, pathway, userId, progress],
  );

  if (!pathway || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header backHref={`/academie/${pathwayId}`} currentTool="Quiz" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Lock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Quiz introuvable.</p>
            <Link href="/academie" className="text-sm text-blue-600 dark:text-blue-400 mt-2 inline-block hover:underline">
              Retour à l&apos;Académie
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref={`/academie/${pathwayId}`} currentTool={quiz.title} />

      {gameState === "intro" && (
        <IntroScreen
          quizTitle={quiz.title}
          quizDescription={quiz.description}
          tier={quiz.tier}
          questionCount={quiz.questions.length}
          onStart={startSession}
          pathwayId={pathwayId}
          pathwayTitle={pathway.title}
        />
      )}

      {gameState === "playing" && questions.length > 0 && (
        <PlayingScreen
          questions={questions}
          shuffledOptions={shuffledOptions}
          currentIndex={currentIndex}
          remainingMs={remainingMs}
          answered={answered}
          onAnswer={handleAnswer}
        />
      )}

      {gameState === "finished" && (
        <FinishedScreen
          questions={questions}
          shuffledOptions={shuffledOptions}
          shuffledOrders={shuffledOrders}
          answers={answers}
          passed={passed}
          badgeJustEarned={badgeJustEarned}
          badgeName={pathway.final_badge.name}
          nextQuizId={nextQuizId}
          pathwayId={pathwayId}
          onRetry={startSession}
        />
      )}
    </div>
  );
}
