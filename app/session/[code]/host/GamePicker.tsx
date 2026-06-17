"use client";

import { useState } from "react";
import {
  X, Loader2, ChevronRight,
  BarChart3, ListChecks, Heart, Star, EyeOff,
  Link2, Lock, Zap, Pencil, Compass, Smile, Users2,
} from "lucide-react";
import { CHALLENGES, getRandomChallenge } from "@/lib/code-secret/challenges";
import type { Difficulty } from "@/lib/code-secret/types";

export type GameType =
  | "retrospective"
  | "abcde"
  | "kudo_cards"
  | "roti"
  | "undercover"
  | "chaine"
  | "code_secret"
  | "speed_retro"
  | "draw"
  | "boussole"
  | "humeur"
  | "tribu";

export type LaunchResult = {
  activityId: string;
  roomCode: string;
  gameType: GameType;
  gamePlayers: Record<string, string>;
};

type Game = {
  type: GameType;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  needsConfig: boolean;
};

const GAMES: Game[] = [
  {
    type: "retrospective",
    label: "Rétrospective",
    description: "Health radar 9 critères",
    icon: <BarChart3 size={20} className="text-teal-600 dark:text-teal-400" />,
    iconBg: "bg-teal-50 dark:bg-teal-950",
    needsConfig: false,
  },
  {
    type: "abcde",
    label: "ABCDE",
    description: "Décision collaborative 5 étapes",
    icon: <ListChecks size={20} className="text-indigo-600 dark:text-indigo-400" />,
    iconBg: "bg-indigo-50 dark:bg-indigo-950",
    needsConfig: true,
  },
  {
    type: "kudo_cards",
    label: "Kudo Cards",
    description: "Cartes de reconnaissance",
    icon: <Star size={20} className="text-amber-500 dark:text-amber-400" />,
    iconBg: "bg-amber-50 dark:bg-amber-950",
    needsConfig: false,
  },
  {
    type: "roti",
    label: "ROTI",
    description: "Retour sur le temps investi",
    icon: <Heart size={20} className="text-rose-500 dark:text-rose-400" />,
    iconBg: "bg-rose-50 dark:bg-rose-950",
    needsConfig: false,
  },
  {
    type: "undercover",
    label: "Undercover",
    description: "Qui est l'infiltré ?",
    icon: <EyeOff size={20} className="text-purple-600 dark:text-purple-400" />,
    iconBg: "bg-purple-50 dark:bg-purple-950",
    needsConfig: false,
  },
  {
    type: "chaine",
    label: "La Chaîne",
    description: "Mot par mot, tour par tour",
    icon: <Link2 size={20} className="text-cyan-600 dark:text-cyan-400" />,
    iconBg: "bg-cyan-50 dark:bg-cyan-950",
    needsConfig: true,
  },
  {
    type: "code_secret",
    label: "Code Secret",
    description: "Déchiffrez le message caché",
    icon: <Lock size={20} className="text-orange-600 dark:text-orange-400" />,
    iconBg: "bg-orange-50 dark:bg-orange-950",
    needsConfig: true,
  },
  {
    type: "speed_retro",
    label: "Speed Rétro",
    description: "Rétrospective rapide en équipe",
    icon: <Zap size={20} className="text-yellow-500 dark:text-yellow-400" />,
    iconBg: "bg-yellow-50 dark:bg-yellow-950",
    needsConfig: false,
  },
  {
    type: "draw",
    label: "Draw",
    description: "Dessin collaboratif",
    icon: <Pencil size={20} className="text-pink-500 dark:text-pink-400" />,
    iconBg: "bg-pink-50 dark:bg-pink-950",
    needsConfig: false,
  },
  {
    type: "boussole",
    label: "Boussole",
    description: "Profil d'équipe en 4 dimensions",
    icon: <Compass size={20} className="text-blue-600 dark:text-blue-400" />,
    iconBg: "bg-blue-50 dark:bg-blue-950",
    needsConfig: false,
  },
  {
    type: "humeur",
    label: "Humeur du jour",
    description: "Météo de l'équipe en images",
    icon: <Smile size={20} className="text-rose-400 dark:text-rose-300" />,
    iconBg: "bg-rose-50 dark:bg-rose-950",
    needsConfig: false,
  },
  {
    type: "tribu",
    label: "Tribu",
    description: "Affinités et tribus d'équipe",
    icon: <Users2 size={20} className="text-teal-600 dark:text-teal-400" />,
    iconBg: "bg-teal-50 dark:bg-teal-950",
    needsConfig: false,
  },
];

const INPUT_CLS =
  "w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500";

type Props = {
  sessionCode: string;
  participantId: string;
  playerSecret: string;
  onLaunched: (result: LaunchResult) => void;
  onClose: () => void;
};

export function GamePicker({ sessionCode, participantId, playerSecret, onLaunched, onClose }: Props) {
  const [selected, setSelected]       = useState<Game | null>(null);
  const [launching, setLaunching]     = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // ABCDE params
  const [problem, setProblem]         = useState("");
  const [timerPerStep, setTimerPerStep] = useState(0);

  // Chaine params
  const [starterWord, setStarterWord] = useState("");

  // Code Secret params
  const [difficulty, setDifficulty]   = useState<Difficulty>("easy");
  const [gameMode, setGameMode]       = useState<"coop" | "competitive">("coop");
  const [challengeId, setChallengeId] = useState(() => getRandomChallenge("easy").id);

  function handleDifficultyChange(d: Difficulty) {
    setDifficulty(d);
    setChallengeId(getRandomChallenge(d).id);
  }

  function selectGame(game: Game) {
    setSelected(game);
    setError(null);
    if (!game.needsConfig) {
      // Lance directement
      launch(game, {});
    }
  }

  function canLaunchConfig(): boolean {
    if (!selected) return false;
    if (selected.type === "abcde") return problem.trim().length > 0;
    if (selected.type === "chaine") return starterWord.trim().length > 0;
    if (selected.type === "code_secret") return challengeId.length > 0;
    return true;
  }

  async function launchConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !canLaunchConfig()) return;

    const params: Record<string, unknown> = {};
    if (selected.type === "abcde") {
      params.problem_statement = problem.trim();
      if (timerPerStep > 0) params.timer_per_step = timerPerStep;
    }
    if (selected.type === "chaine") {
      params.starter_word = starterWord.trim();
    }
    if (selected.type === "code_secret") {
      params.challenge_id       = challengeId;
      params.difficulty         = difficulty;
      params.game_mode          = gameMode;
      params.time_limit_seconds = CHALLENGES.find(c => c.id === challengeId)?.timeLimitSeconds ?? 600;
    }
    launch(selected, params);
  }

  async function launch(game: Game, gameParams: Record<string, unknown>) {
    setLaunching(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionCode}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          playerSecret,
          gameType: game.type,
          gameParams,
        }),
      });

      const data = await res.json() as {
        activityId?: string;
        roomCode?: string;
        gameType?: GameType;
        gamePlayers?: Record<string, string>;
        error?: string;
      };

      if (!res.ok || !data.activityId || !data.roomCode) {
        setError(data.error ?? "Erreur lors du lancement.");
        setLaunching(false);
        setSelected(null);
        return;
      }

      onLaunched({
        activityId: data.activityId,
        roomCode: data.roomCode,
        gameType: data.gameType ?? game.type,
        gamePlayers: data.gamePlayers ?? {},
      });
    } catch {
      setError("Erreur de connexion.");
      setLaunching(false);
      setSelected(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {selected ? selected.label : "Choisir une activité"}
          </h2>
          <button
            onClick={onClose}
            disabled={launching}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {launching ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-500">
              <Loader2 size={28} className="animate-spin text-violet-500" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Lancement de {selected?.label}…
              </p>
            </div>
          ) : !selected ? (
            /* ── Grille de sélection ── */
            <div className="grid grid-cols-2 gap-2">
              {GAMES.map((game) => (
                <button
                  key={game.type}
                  onClick={() => selectGame(game)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors text-left"
                >
                  <span className={`w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 ${game.iconBg}`}>
                    {game.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                      {game.label}
                    </span>
                    <span className="block text-xs text-gray-400 leading-tight mt-0.5">
                      {game.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* ── Formulaire de configuration ── */
            <form onSubmit={launchConfig} className="space-y-4">
              {selected.type === "abcde" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Sujet de la décision <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      autoFocus
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      placeholder="Quelle décision devons-nous prendre ?"
                      rows={3}
                      className={INPUT_CLS + " resize-none"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Minuteur par étape (min) —{" "}
                      <span className="font-normal text-gray-400">0 = sans limite</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={timerPerStep}
                      onChange={(e) => setTimerPerStep(Number(e.target.value))}
                      className={INPUT_CLS}
                    />
                  </div>
                </>
              )}

              {selected.type === "chaine" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Mot de départ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={starterWord}
                    onChange={(e) => setStarterWord(e.target.value)}
                    placeholder="Chat, Voyage, Innovation…"
                    maxLength={30}
                    className={INPUT_CLS}
                  />
                </div>
              )}

              {selected.type === "code_secret" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Difficulté
                    </label>
                    <div className="flex gap-2">
                      {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleDifficultyChange(d)}
                          className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                            difficulty === d
                              ? "bg-violet-600 border-violet-600 text-white"
                              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300"
                          }`}
                        >
                          {d === "easy" ? "Facile" : d === "medium" ? "Moyen" : "Difficile"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Défi
                    </label>
                    <select
                      value={challengeId}
                      onChange={(e) => setChallengeId(e.target.value)}
                      className={INPUT_CLS}
                    >
                      {CHALLENGES.filter((c) => c.difficulty === difficulty).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Mode
                    </label>
                    <div className="flex gap-2">
                      {(["coop", "competitive"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setGameMode(m)}
                          className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                            gameMode === m
                              ? "bg-violet-600 border-violet-600 text-white"
                              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300"
                          }`}
                        >
                          {m === "coop" ? "Coopératif" : "Compétitif"}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setSelected(null); setError(null); }}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={!canLaunchConfig()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={15} />
                  Lancer
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
