"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import type { DrawGuess, DrawPlayer, DrawRoom, Stroke } from "@/lib/draw/types";
import { pickRandomWords } from "@/lib/draw/words";
import { computeProximity } from "@/lib/draw/proximity";

// ── Canvas helper ─────────────────────────────────────────────────────────────

function renderStrokeOnCanvas(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  w: number,
  h: number
) {
  if (stroke.points.length === 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.lineWidth = stroke.brushSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : "#111827";
  ctx.globalCompositeOperation = "source-over";

  if (stroke.points.length === 1) {
    ctx.arc(
      stroke.points[0].x * w,
      stroke.points[0].y * h,
      stroke.brushSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = stroke.tool === "eraser" ? "#ffffff" : "#111827";
    ctx.fill();
  } else {
    ctx.moveTo(stroke.points[0].x * w, stroke.points[0].y * h);
    stroke.points.slice(1).forEach((p) => ctx.lineTo(p.x * w, p.y * h));
    ctx.stroke();
  }
  ctx.restore();
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DrawPlayPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  // Player identity
  const [playerId, setPlayerId] = useState<string>("");
  const [playerSecret, setPlayerSecret] = useState<string>("");
  const [myPseudo, setMyPseudo] = useState<string>("");

  // Game state
  const [room, setRoom] = useState<DrawRoom | null>(null);
  const [players, setPlayers] = useState<DrawPlayer[]>([]);
  const [guesses, setGuesses] = useState<DrawGuess[]>([]);
  const [loading, setLoading] = useState(true);

  // Timer
  const [timeLeft, setTimeLeft] = useState(80);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const [brushSize, setBrushSize] = useState<2 | 6 | 12>(6);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");

  // Realtime channel
  const channelRef = useRef<{ send: (msg: unknown) => void } | null>(null);

  // Chat
  const [chatInput, setChatInput] = useState("");
  const [submittingGuess, setSubmittingGuess] = useState(false);
  const submittingGuessRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Word selection modal timer
  const [wordSelectTimer, setWordSelectTimer] = useState(10);
  const wordSelectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // End-round summary
  const [showEndRound, setShowEndRound] = useState(false);
  const [endRoundWord, setEndRoundWord] = useState("");
  const [endRoundCountdown, setEndRoundCountdown] = useState(0);
  const prevRoundRef = useRef(0);
  const prevDrawerRef = useRef<string | null>(null);
  const prevRoundWordRef = useRef<string | null>(null);
  const endRoundTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracks which drawer-turn overlay was already triggered (avoids double-show)
  // Key = "<round>-<drawerId>" so it resets on every new drawer, not just new round
  const endRoundShownForRoundRef = useRef("");
  const nonHostEndRoundShownRef = useRef(false);

  // Prevent double advance
  const isAdvancingRef = useRef(false);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/draw", label: "Draw It" },
    { label: upperCode },
  ];

  // ── Load player identity ──────────────────────────────────────────────────

  useEffect(() => {
    const stored = localStorage.getItem(`draw_player_${upperCode}`);
    if (!stored) {
      router.replace(`/toolbox/draw/join?code=${upperCode}`);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { playerId: string; playerSecret?: string; pseudo: string };
      setPlayerId(parsed.playerId);
      setPlayerSecret(parsed.playerSecret ?? "");
      setMyPseudo(parsed.pseudo);
    } catch {
      router.replace(`/toolbox/draw/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // ── Realtime channel (drawing broadcast) ─────────────────────────────────

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase.channel(`draw-room-${upperCode}`, {
      config: { broadcast: { self: false } },
    });

    ch.on("broadcast", { event: "stroke" }, ({ payload }: { payload: unknown }) => {
      const stroke = payload as Stroke;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (ctx) renderStrokeOnCanvas(ctx, stroke, canvas.width, canvas.height);
    });

    ch.on("broadcast", { event: "clear" }, () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    ch.subscribe();
    channelRef.current = ch as unknown as { send: (msg: unknown) => void };

    return () => {
      ch.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // Client-side fallback word choices (used when DB word_choices is null for the drawer)
  const [localWordChoices, setLocalWordChoices] = useState<string[]>([]);

  // ── Fetch room ────────────────────────────────────────────────────────────

  const fetchRoom = useCallback(async (isMounted?: { current: boolean }) => {
    const res = await fetch(`/api/draw/room/${upperCode}`);
    if (isMounted && !isMounted.current) return;
    if (!res.ok) {
      if (!isMounted || isMounted.current) setLoading(false);
      return;
    }
    const data = (await res.json()) as DrawRoom & { players: DrawPlayer[] };
    if (isMounted && !isMounted.current) return;
    setRoom(data);
    setPlayers(data.players ?? []);
    setLoading(false);

    if (data.status === "finished") {
      if (!isMounted || isMounted.current) router.push(`/toolbox/draw/${upperCode}/results`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  useEffect(() => {
    if (!playerId) return;
    const mountedRef = { current: true };
    fetchRoom(mountedRef);
    const id = setInterval(() => fetchRoom(mountedRef), 2000);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [playerId, fetchRoom]);

  // ── Fetch guesses ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!room?.current_round) return;
    const mountedRef = { current: true };
    const fetchGuesses = async () => {
      const res = await fetch(
        `/api/draw/room/${upperCode}/guesses?round=${room.current_round}`
      );
      if (!mountedRef.current) return;
      if (res.ok) {
        const data = await res.json();
        if (!mountedRef.current) return;
        setGuesses(Array.isArray(data) ? (data as DrawGuess[]) : []);
      }
    };
    fetchGuesses();
    const id = setInterval(fetchGuesses, 2000);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.current_round, upperCode]);

  // ── Timer (client-side countdown) ────────────────────────────────────────

  useEffect(() => {
    if (!room) return;
    if (!room.round_started_at) {
      setTimeLeft(room.round_duration_seconds);
      return;
    }
    const tick = () => {
      const elapsed =
        (Date.now() - new Date(room.round_started_at!).getTime()) / 1000;
      setTimeLeft(Math.max(0, Math.round(room.round_duration_seconds - elapsed)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [room?.round_started_at, room?.round_duration_seconds, room]);

  // ── Word selection countdown ──────────────────────────────────────────────

  const isDrawer = room?.current_drawer_player_id === playerId;

  // Generate client-side fallback words when drawer has no word_choices from DB
  useEffect(() => {
    if (isDrawer && !room?.current_word && !(room?.word_choices?.length)) {
      setLocalWordChoices((prev) =>
        prev.length === 0 ? pickRandomWords("all", 3) : prev
      );
    } else {
      setLocalWordChoices([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawer, room?.current_word, room?.word_choices]);

  const effectiveWordChoices =
    (room?.word_choices?.length ? room.word_choices : null) ??
    (isDrawer ? localWordChoices : null);

  const showWordSelect =
    isDrawer &&
    !room?.current_word &&
    (effectiveWordChoices?.length ?? 0) > 0 &&
    !showEndRound;

  useEffect(() => {
    if (!showWordSelect) {
      if (wordSelectTimerRef.current) clearInterval(wordSelectTimerRef.current);
      setWordSelectTimer(10);
      return;
    }
    setWordSelectTimer(10);
    let secs = 10;
    wordSelectTimerRef.current = setInterval(() => {
      secs -= 1;
      setWordSelectTimer(secs);
      if (secs <= 0) {
        if (wordSelectTimerRef.current) clearInterval(wordSelectTimerRef.current);
        const firstWord = effectiveWordChoices?.[0] ?? "dessin";
        selectWord(firstWord);
      }
    }, 1000);
    return () => {
      if (wordSelectTimerRef.current) clearInterval(wordSelectTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWordSelect]);

  // ── Reload canvas on round change ─────────────────────────────────────────

  useEffect(() => {
    if (!room?.current_round) return;

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);

    // Detect any turn change: either current_round OR current_drawer changed.
    // current_round only increments when all players have drawn once, so using
    // current_drawer_player_id ensures we also reset between manches within a cycle.
    const roundChanged =
      prevRoundRef.current > 0 && prevRoundRef.current !== room.current_round;
    const drawerChanged =
      prevDrawerRef.current !== null &&
      prevDrawerRef.current !== room.current_drawer_player_id;

    if (roundChanged || drawerChanged) {
      setShowEndRound(false);
      if (endRoundTimerRef.current) {
        clearInterval(endRoundTimerRef.current);
        endRoundTimerRef.current = null;
      }
      isAdvancingRef.current = false;
      nonHostEndRoundShownRef.current = false;
    }

    prevRoundRef.current = room.current_round;
    prevDrawerRef.current = room.current_drawer_player_id;

    // Replay existing strokes (reconnect)
    fetch(`/api/draw/room/${upperCode}/strokes?round=${room.current_round}`)
      .then((r) => r.json())
      .then((strokes: unknown) => {
        if (!Array.isArray(strokes)) return;
        const canvas2 = canvasRef.current;
        if (!canvas2) return;
        const ctx = canvas2.getContext("2d");
        if (!ctx) return;
        (strokes as Stroke[]).forEach((s) =>
          renderStrokeOnCanvas(ctx, s, canvas2.width, canvas2.height)
        );
      })
      .catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.current_round, room?.current_drawer_player_id]);

  // ── Track current_word changes for end-round word display ─────────────────
  useEffect(() => {
    if (room?.current_word) {
      prevRoundWordRef.current = room.current_word;
    }
  }, [room?.current_word]);

  // ── Auto-advance (any player) ─────────────────────────────────────────────

  const isHost = room?.host_player_id === playerId;

  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (!room.current_word || !room.round_started_at) return;
    if (isAdvancingRef.current) return;
    // Use composite key so each new drawer triggers a fresh check,
    // even when current_round hasn't changed (multiple draws per round)
    const turnKey = `${room.current_round}-${room.current_drawer_player_id}`;
    if (endRoundShownForRoundRef.current === turnKey) return;

    const nonDrawers = players.filter(
      (p) => p.id !== room.current_drawer_player_id
    );
    const allGuessed =
      nonDrawers.length > 0 &&
      nonDrawers.every((p) =>
        guesses.some((g) => g.player_id === p.id && g.is_correct)
      );

    if (timeLeft <= 0 || allGuessed) {
      endRoundShownForRoundRef.current = turnKey;
      isAdvancingRef.current = true;

      // Show the word + countdown overlay, then advance
      const word = prevRoundWordRef.current ?? room.current_word;
      setEndRoundWord(word);
      setEndRoundCountdown(5);
      setShowEndRound(true);

      let count = 5;
      endRoundTimerRef.current = setInterval(() => {
        count -= 1;
        setEndRoundCountdown(count);
        if (count <= 0) {
          if (endRoundTimerRef.current) {
            clearInterval(endRoundTimerRef.current);
            endRoundTimerRef.current = null;
          }
          nextRound();
        }
      }, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, guesses]);

  // ── Cleanup end-round timer on unmount ────────────────────────────────────

  useEffect(() => {
    return () => {
      if (endRoundTimerRef.current) clearInterval(endRoundTimerRef.current);
    };
  }, []);

  // ── Auto-scroll chat ──────────────────────────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [guesses]);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function selectWord(word: string) {
    await fetch(`/api/draw/room/${upperCode}/round`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
      body: JSON.stringify({ action: "select_word", playerId, word }),
    });
    await fetchRoom();
  }

  async function nextRound() {
    const res = await fetch(`/api/draw/room/${upperCode}/round`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
      body: JSON.stringify({ action: "next_round", playerId }),
    });
    const data = (await res.json()) as { finished?: boolean };
    if (data.finished) {
      router.push(`/toolbox/draw/${upperCode}/results`);
    } else {
      await fetchRoom();
    }
  }

  async function submitGuess(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || isDrawer || submittingGuessRef.current || !room) return;
    submittingGuessRef.current = true;
    const content = chatInput.trim();
    setChatInput("");
    setSubmittingGuess(true);

    // Optimistic update — show the message immediately without waiting for the poll
    const optimisticId = `opt-${Date.now()}`;
    setGuesses((prev) => [
      ...prev,
      {
        id: optimisticId,
        room_id: room.id,
        player_id: playerId,
        round_number: room.current_round,
        content,
        is_correct: false,
        points_earned: 0,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch(`/api/draw/room/${upperCode}/guesses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId, content }),
      });

      // Replace optimistic entry with real server data
      const gRes = await fetch(
        `/api/draw/room/${upperCode}/guesses?round=${room.current_round}`
      );
      if (gRes.ok) {
        const data = await gRes.json();
        if (Array.isArray(data)) setGuesses(data as DrawGuess[]);
      }

      // If correct, also refresh room immediately (score update)
      if (res.ok) {
        const resData = (await res.json().catch(() => ({}))) as { isCorrect?: boolean };
        if (resData.isCorrect) await fetchRoom();
      }
    } finally {
      submittingGuessRef.current = false;
      setSubmittingGuess(false);
    }
  }

  // ── Canvas event handlers ─────────────────────────────────────────────────

  function getPoint(
    e: React.PointerEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }

  function handleMouseDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || !room?.current_word) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    currentPointsRef.current = [getPoint(e, canvas)];
  }

  function handleMouseMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || !isDrawer || !room?.current_word) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getPoint(e, canvas);
    currentPointsRef.current.push(pt);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pts = currentPointsRef.current;
    if (pts.length < 2) return;

    ctx.beginPath();
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : "#111827";
    ctx.moveTo(
      pts[pts.length - 2].x * canvas.width,
      pts[pts.length - 2].y * canvas.height
    );
    ctx.lineTo(
      pts[pts.length - 1].x * canvas.width,
      pts[pts.length - 1].y * canvas.height
    );
    ctx.stroke();
  }

  function handleMouseUp() {
    if (!isDrawingRef.current || !isDrawer || !room?.current_word) return;
    isDrawingRef.current = false;
    if (currentPointsRef.current.length === 0) return;

    const stroke: Stroke = {
      points: currentPointsRef.current,
      brushSize,
      tool,
      drawerPlayerId: playerId,
    };

    channelRef.current?.send({
      type: "broadcast",
      event: "stroke",
      payload: stroke,
    });

    // Persist to DB (fire and forget)
    fetch(`/api/draw/room/${upperCode}/strokes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        strokeData: stroke,
        roundNumber: room?.current_round,
      }),
    }).catch(() => undefined);

    currentPointsRef.current = [];
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    }
    channelRef.current?.send({
      type: "broadcast",
      event: "clear",
      payload: {},
    });
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const wordAsUnderscores = room?.current_word
    ? room.current_word
        .split("")
        .map((c) => (c === " " ? "  " : "_"))
        .join(" ")
    : "_ _ _ _";

  const myCorrectGuess = guesses.find(
    (g) => g.player_id === playerId && g.is_correct
  );

  const currentDrawer = players.find(
    (p) => p.id === room?.current_drawer_player_id
  );

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          Session introuvable.
        </div>
      </div>
    );
  }

  // ── End-round word reveal (all players) ──────────────────────────────────
  // Must come before ALL other early returns so it is never pre-empted by the
  // "waiting for drawer" or "word select" screens when current_word is null.

  if (showEndRound) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center max-w-sm w-full shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Le mot était
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              {endRoundWord}
            </p>
            <div className="space-y-1">
              {[...players]
                .sort((a, b) => b.score - a.score)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: p.avatar_color }}
                      />
                      {p.pseudo}
                      {p.pseudo === myPseudo && (
                        <span className="text-xs text-gray-400">(vous)</span>
                      )}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {p.score} pts
                    </span>
                  </div>
                ))}
            </div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-4">
              Prochaine manche dans{" "}
              <span className="tabular-nums text-orange-600 dark:text-orange-400">
                {endRoundCountdown}s
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Word selection modal (drawer only) ────────────────────────────────────

  if (showWordSelect && effectiveWordChoices) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center shadow-xl">
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-2">
                Choisis un mot à dessiner
              </p>
              <p className="text-4xl font-bold tabular-nums text-gray-900 dark:text-white mb-1">
                {wordSelectTimer}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
                seconde{wordSelectTimer > 1 ? "s" : ""} restante{wordSelectTimer > 1 ? "s" : ""}
              </p>
              <div className="space-y-3">
                {effectiveWordChoices.map((w) => (
                  <button
                    key={w}
                    onClick={() => selectWord(w)}
                    className="w-full px-5 py-4 text-base font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-700 dark:hover:text-orange-300 transition-all"
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Waiting for word selection (non-drawer only) ──────────────────────────

  if (!room.current_word && room.status === "playing" && !isDrawer) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <p className="text-sm">
            {currentDrawer?.pseudo ?? "Le dessinateur"} choisit un mot…
          </p>
        </div>
      </div>
    );
  }

  // ── Main game layout ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-3 py-3 flex flex-col md:flex-row gap-3">

        {/* Left: Players */}
        <div className="w-full md:w-48 flex-shrink-0">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Joueurs
              </span>
            </div>
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {players.map((p) => {
                const isCurrentDrawer = p.id === room.current_drawer_player_id;
                const hasGuessed = guesses.some(
                  (g) => g.player_id === p.id && g.is_correct
                );
                return (
                  <li
                    key={p.id}
                    className={`px-3 py-2 flex items-center gap-2 ${
                      isCurrentDrawer
                        ? "bg-orange-50 dark:bg-orange-950/30"
                        : ""
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.avatar_color }}
                    />
                    <span className="flex-1 text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                      {p.pseudo}
                    </span>
                    {isCurrentDrawer && (
                      <span title="Dessinateur" className="text-sm">🎨</span>
                    )}
                    {hasGuessed && !isCurrentDrawer && (
                      <CheckCircle2
                        size={12}
                        className="text-emerald-500 flex-shrink-0"
                      />
                    )}
                    <span className="text-xs font-bold text-gray-900 dark:text-white flex-shrink-0 tabular-nums">
                      {p.score} <span className="font-normal text-gray-400 dark:text-gray-500">pts</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          {/* Round info bar */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              Manche {room.current_round} / {room.rounds_total}
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate text-center flex-1">
              {isDrawer && room.current_word
                ? `Tu dessines : ${room.current_word}`
                : wordAsUnderscores}
            </span>
            <span
              className={`text-sm font-mono font-bold flex items-center gap-1 flex-shrink-0 ${
                timeLeft <= 10 ? "text-red-500" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <Clock size={13} />
              {timeLeft}s
            </span>
          </div>

          {/* Canvas */}
          <div
            className="relative bg-white border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
            style={{ aspectRatio: "4/3" }}
          >
            <canvas
              ref={canvasRef}
              width={700}
              height={525}
              className="w-full h-full"
              style={{
                cursor:
                  isDrawer && room.current_word
                    ? tool === "eraser"
                      ? "cell"
                      : "crosshair"
                    : "default",
                touchAction: "none",
              }}
              onPointerDown={handleMouseDown}
              onPointerMove={handleMouseMove}
              onPointerUp={handleMouseUp}
              onPointerLeave={handleMouseUp}
            />
          </div>

          {/* Toolbar (drawer only) */}
          {isDrawer && room.current_word && (
            <div className="flex items-center gap-2 flex-wrap">
              {([2, 6, 12] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setBrushSize(size);
                    setTool("pen");
                  }}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                    brushSize === size && tool === "pen"
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  title={`Pinceau ${size}px`}
                >
                  <div
                    className="rounded-full bg-gray-900 dark:bg-white"
                    style={{ width: size, height: size }}
                  />
                </button>
              ))}
              <button
                onClick={() => setTool("eraser")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  tool === "eraser"
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                }`}
              >
                Gomme
              </button>
              <button
                onClick={handleClear}
                className="ml-auto px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                Tout effacer
              </button>
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
          <div
            className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col"
            style={{ minHeight: 280, maxHeight: 480 }}
          >
            <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Propositions
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {guesses.map((g) => {
                const pseudo =
                  g.draw_players?.pseudo ??
                  players.find((p) => p.id === g.player_id)?.pseudo ??
                  (g.player_id === playerId ? myPseudo : "?");

                const proximity =
                  !g.is_correct && room?.current_word
                    ? computeProximity(g.content, room.current_word)
                    : null;

                const proximityClass =
                  g.is_correct
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium"
                    : proximity === "typo"
                    ? "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300"
                    : proximity === "close"
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                    : proximity === "far"
                    ? "text-red-500 dark:text-red-400"
                    : "text-gray-600 dark:text-gray-400";

                return (
                  <div
                    key={g.id}
                    className={`text-xs rounded-lg px-2 py-1.5 ${proximityClass}`}
                  >
                    {g.is_correct ? (
                      <span>✓ {pseudo} a trouvé !</span>
                    ) : (
                      <span>
                        <span className={`font-medium ${
                          proximity === "typo"
                            ? "text-orange-800 dark:text-orange-200"
                            : proximity === "close"
                            ? "text-blue-800 dark:text-blue-200"
                            : proximity === "far"
                            ? "text-red-600 dark:text-red-300"
                            : "text-gray-700 dark:text-gray-300"
                        }`}>
                          {pseudo}
                        </span>{" "}
                        : {g.content}
                      </span>
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Chat input */}
          <form onSubmit={submitGuess} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isDrawer || !!myCorrectGuess}
              placeholder={
                isDrawer
                  ? "Vous dessinez…"
                  : myCorrectGuess
                  ? "Bravo, vous avez trouvé !"
                  : "Votre proposition…"
              }
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isDrawer || !!myCorrectGuess || !chatInput.trim() || submittingGuess}
              className="px-3 py-2 text-sm font-medium bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-40 transition-colors flex-shrink-0"
            >
              →
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
