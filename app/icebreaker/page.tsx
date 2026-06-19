"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Clock, Shuffle, Plus, X, Check, List, Pencil, Trash2, RefreshCw, RotateCcw } from "lucide-react";
import { Header } from "@/components/Header";
import type { IcebreakerCategory, IcebreakerQuestion } from "@/lib/types";
import { ICEBREAKER_CATEGORY_LABELS } from "@/lib/types";
import { pickIcebreaker } from "@/lib/icebreakers/picker";
import { ICEBREAKER_QUESTIONS } from "@/lib/icebreakers/questions";
import {
  loadAnecdotes,
  addAnecdote as dbAddAnecdote,
  updateAnecdote as dbUpdateAnecdote,
  deleteAnecdote as dbDeleteAnecdote,
} from "@/lib/supabase/anecdotes";
import { useI18n } from "@/lib/i18n";

type AnimState = "idle" | "unflipping" | "shuffling" | "flipping" | "revealed";

const CATEGORY_ORDER: IcebreakerCategory[] = [
  "identity", "preferences", "vision", "offbeat", "surprise", "anecdotes",
];

const CARD_BG: Record<IcebreakerCategory, string> = {
  identity:    "#2563EB",
  preferences: "#7C3AED",
  vision:      "#EA580C",
  offbeat:     "#D97706",
  surprise:    "#DB2777",
  anecdotes:   "#059669",
};

const BADGE_CLS: Record<IcebreakerCategory, string> = {
  identity:    "bg-blue-100   dark:bg-blue-900/60   text-blue-800   dark:text-blue-200",
  preferences: "bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200",
  vision:      "bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200",
  offbeat:     "bg-amber-100  dark:bg-amber-900/60  text-amber-800  dark:text-amber-200",
  surprise:    "bg-pink-100   dark:bg-pink-900/60   text-pink-800   dark:text-pink-200",
  anecdotes:   "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200",
};

const PILL_CLS: Record<IcebreakerCategory, string> = {
  identity:    "bg-blue-50   dark:bg-blue-950/50  text-blue-700   dark:text-blue-300   border-blue-200   dark:border-blue-800",
  preferences: "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  vision:      "bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  offbeat:     "bg-amber-50  dark:bg-amber-950/50  text-amber-700  dark:text-amber-300  border-amber-200  dark:border-amber-800",
  surprise:    "bg-pink-50   dark:bg-pink-950/50   text-pink-700   dark:text-pink-300   border-pink-200   dark:border-pink-800",
  anecdotes:   "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
};


const WHEEL_COLORS = [
  "#2563EB", "#DB2777", "#EA580C", "#7C3AED",
  "#059669", "#D97706", "#0891B2", "#65A30D",
  "#DC2626", "#9333EA", "#0284C7", "#CA8A04",
];

// ── Wheel ──────────────────────────────────────────────────────────────────

function slicePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => (d - 90) * (Math.PI / 180);
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  return `M ${cx} ${cy} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${endDeg - startDeg > 180 ? 1 : 0} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
}

const SPIN_DURATION = 4200;
const CX = 80, CY = 80, R = 70, TEXT_R = 48;

function SpinWheel({ allParticipants }: { allParticipants: string[] }) {
  const { t } = useI18n();
  const [rotation, setRotation]   = useState(0);
  const [spinning, setSpinning]   = useState(false);
  const [winner, setWinner]       = useState<string | null>(null);
  const [winnerColor, setWinnerColor] = useState("#2563EB");
  const [drawn, setDrawn]         = useState<string[]>([]);

  // Reset drawn order when participant list changes structurally
  useEffect(() => { setDrawn([]); setWinner(null); }, [allParticipants.join(",")]);

  const available = allParticipants.filter((p) => !drawn.includes(p));
  const n = available.length;
  const sliceAngle = n > 0 ? 360 / n : 360;
  const fontSize = n <= 4 ? 10 : n <= 7 ? 8 : 7;
  const allDone = allParticipants.length > 0 && available.length === 0;

  function spin() {
    if (spinning || n < 1) return;
    const targetIdx = Math.floor(Math.random() * n);
    const centerOfTarget = targetIdx * sliceAngle + sliceAngle / 2;
    const targetRemainder = (360 - centerOfTarget % 360 + 360) % 360;
    const extraSpins = 8 + Math.floor(Math.random() * 5);
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = ((targetRemainder - currentMod) + 360) % 360;
    const newRotation = rotation + extraSpins * 360 + delta;
    const winnerName = available[targetIdx];
    const winnerCol  = WHEEL_COLORS[allParticipants.indexOf(winnerName) % WHEEL_COLORS.length];
    setSpinning(true);
    setWinner(null);
    setRotation(newRotation);
    setTimeout(() => {
      setSpinning(false);
      setWinner(winnerName);
      setWinnerColor(winnerCol);
      setDrawn((prev) => [...prev, winnerName]);
    }, SPIN_DURATION);
  }

  return (
    <div className="flex flex-col items-center gap-2.5">
      {/* Pointer + wheel */}
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 z-10">
          <svg width="14" height="11" viewBox="0 0 14 11">
            <polygon points="7,11 0,0 14,0" className="fill-gray-800 dark:fill-gray-100" />
          </svg>
        </div>
        <div
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? `transform ${SPIN_DURATION}ms cubic-bezier(0.15, 0.85, 0.3, 1)` : "none",
            borderRadius: "50%",
          }}
        >
          <svg width="160" height="160" viewBox="0 0 160 160">
            {n === 0 ? (
              <circle cx={CX} cy={CY} r={R} fill="#e5e7eb" />
            ) : (
              available.map((name, i) => {
                const startDeg = i * sliceAngle;
                const endDeg   = (i + 1) * sliceAngle;
                const midDeg   = startDeg + sliceAngle / 2;
                const toRad    = (d: number) => (d - 90) * (Math.PI / 180);
                const tx = CX + TEXT_R * Math.cos(toRad(midDeg));
                const ty = CY + TEXT_R * Math.sin(toRad(midDeg));
                const color = WHEEL_COLORS[allParticipants.indexOf(name) % WHEEL_COLORS.length];
                const label = name.length > 8 ? name.slice(0, 7) + "…" : name;
                return (
                  <g key={name}>
                    <path d={slicePath(CX, CY, R, startDeg, endDeg)} fill={color} />
                    <text x={tx.toFixed(2)} y={ty.toFixed(2)} textAnchor="middle" dominantBaseline="middle"
                      fill="white" fontSize={fontSize} fontWeight="700"
                      transform={`rotate(${midDeg}, ${tx.toFixed(2)}, ${ty.toFixed(2)})`}>
                      {label}
                    </text>
                  </g>
                );
              })
            )}
            <circle cx={CX} cy={CY} r={8} fill="white" opacity="0.9" />
            <circle cx={CX} cy={CY} r={4} fill="#6b7280" />
          </svg>
        </div>
      </div>

      {/* Drawn order — compact chips */}
      {drawn.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 max-w-[200px]">
          {drawn.map((name, i) => (
            <span key={name} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white opacity-60"
              style={{ backgroundColor: WHEEL_COLORS[allParticipants.indexOf(name) % WHEEL_COLORS.length] }}>
              {i + 1}. {name}
            </span>
          ))}
        </div>
      )}

      {/* Controls */}
      {allDone ? (
        <button onClick={() => { setDrawn([]); setWinner(null); }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <RotateCcw size={12} /> {t.common.restart}
        </button>
      ) : (
        <button onClick={spin} disabled={spinning || allParticipants.length < 2}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
          <RefreshCw size={13} className={spinning ? "animate-spin" : ""} />
          {spinning ? t.chaine.spinning : t.chaine.spin}
        </button>
      )}

      {allParticipants.length < 2 && !allDone && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {allParticipants.length === 0 ? t.icebreaker.participants : t.lobby.waitingPlayers}
        </p>
      )}

      {winner && !spinning && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-white text-sm font-semibold"
          style={{ backgroundColor: winnerColor }}>
          {winner}
        </div>
      )}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────

function QuestionCard({ displayedCategory, animState, question }: {
  displayedCategory: IcebreakerCategory;
  animState: AnimState;
  question: IcebreakerQuestion | null;
}) {
  const isFlipped = animState === "flipping" || animState === "revealed";
  const bgColor = CARD_BG[displayedCategory];
  return (
    <div className="w-56 sm:w-64" style={{ height: 260, perspective: 1200 }}>
      <div className="relative w-full h-full" style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        {/* Front */}
        <div className="absolute inset-0 rounded-3xl shadow-xl flex flex-col items-center justify-center overflow-hidden"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", backgroundColor: bgColor }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative w-14 h-14 rounded-full bg-white/15 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-white shadow-inner" />
            </div>
          </div>
          <p className="absolute bottom-4 text-white/60 text-xs font-medium tracking-widest uppercase">
            {ICEBREAKER_CATEGORY_LABELS[displayedCategory]}
          </p>
        </div>
        {/* Back */}
        <div className="absolute inset-0 rounded-3xl shadow-xl bg-white dark:bg-gray-900 flex flex-col p-5"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <div className="flex justify-center mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${BADGE_CLS[displayedCategory]}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bgColor }} />
              {ICEBREAKER_CATEGORY_LABELS[displayedCategory]}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="font-serif text-[1rem] leading-relaxed text-gray-900 dark:text-white text-center">{question?.question}</p>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <Clock size={11} /><span>~30 sec. par personne</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function IcebreakerPage() {
  // Card state
  const [animState, setAnimState]                   = useState<AnimState>("idle");
  const [selectedCategories, setSelectedCategories] = useState<Set<IcebreakerCategory>>(new Set());
  const [displayedCategory, setDisplayedCategory]   = useState<IcebreakerCategory>("identity");
  const [question, setQuestion]                     = useState<IcebreakerQuestion | null>(null);
  const [seenIds, setSeenIds]                       = useState<Set<string>>(new Set());
  const [sessionAnecdotes, setSessionAnecdotes]     = useState<IcebreakerQuestion[]>([]);
  const [addingAnecdote, setAddingAnecdote]         = useState(false);
  const [anecdoteDraft, setAnecdoteDraft]           = useState("");
  const [anecdotePanelOpen, setAnecdotePanelOpen]   = useState(false);
  const [editingId, setEditingId]                   = useState<string | null>(null);
  const [editDraft, setEditDraft]                   = useState("");
  const timerRef           = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef           = useRef<HTMLInputElement>(null);
  const editRef            = useRef<HTMLInputElement>(null);
  const coachCompletedRef  = useRef(false);

  // Participants state
  const [participants, setParticipants]         = useState<string[]>([]);
  const [participantDraft, setParticipantDraft] = useState("");
  const participantInputRef = useRef<HTMLInputElement>(null);

  // Tips accordion
  const [tipsOpen, setTipsOpen] = useState(false);

  const { t } = useI18n();
  const TIPS = [t.icebreaker.tips.answer, t.icebreaker.tips.order, t.icebreaker.tips.pass, t.icebreaker.tips.noDebate];

  // Load anecdotes from DB on mount
  useEffect(() => {
    loadAnecdotes().then(setSessionAnecdotes);
  }, []);

  // Card logic
  function clearTimers() { if (timerRef.current) clearTimeout(timerRef.current); }

  function toggleCategory(cat: IcebreakerCategory) {
    setSelectedCategories((prev) => { const next = new Set(prev); if (next.has(cat)) next.delete(cat); else next.add(cat); return next; });
  }

  async function submitAnecdote() {
    const text = anecdoteDraft.trim();
    if (!text) { setAddingAnecdote(false); return; }
    setAnecdoteDraft(""); setAddingAnecdote(false);
    const saved = await dbAddAnecdote(text);
    const newQ: IcebreakerQuestion = saved ?? { id: `local-${Date.now()}`, question: text, category: "anecdotes" };
    setSessionAnecdotes((prev) => [...prev, newQ]);
  }

  async function saveEdit() {
    const text = editDraft.trim();
    const id = editingId;
    setEditingId(null); setEditDraft("");
    if (!text || !id) return;
    setSessionAnecdotes((prev) => prev.map((q) => q.id === id ? { ...q, question: text } : q));
    await dbUpdateAnecdote(id, text);
  }

  async function deleteAnecdote(id: string) {
    setSessionAnecdotes((prev) => {
      const next = prev.filter((q) => q.id !== id);
      if (next.length === 0) { setSelectedCategories((cats) => { const s = new Set(cats); s.delete("anecdotes"); return s; }); setAnecdotePanelOpen(false); }
      return next;
    });
    await dbDeleteAnecdote(id);
  }

  function drawCard(cats: IcebreakerCategory[] = [...selectedCategories]) {
    clearTimers(); setAnimState("shuffling"); setQuestion(null);
    const strip = cats.length > 0 ? cats : CATEGORY_ORDER.filter((c) => c !== "anecdotes" || sessionAnecdotes.length > 0);
    const effectiveStrip = strip.length > 0 ? strip : CATEGORY_ORDER;
    const { question: picked, resetTriggered } = pickIcebreaker(seenIds, cats, sessionAnecdotes);
    setSeenIds(resetTriggered ? new Set([picked.id]) : new Set([...seenIds, picked.id]));
    const FAST = 22, SLOW = 9, TOTAL = FAST + SLOW;
    let step = 0, colorIdx = Math.floor(Math.random() * effectiveStrip.length);
    function tick() {
      colorIdx = (colorIdx + 1) % effectiveStrip.length;
      setDisplayedCategory(effectiveStrip[colorIdx]);
      step++;
      if (step < TOTAL) {
        timerRef.current = setTimeout(tick, step < FAST ? 55 : 55 + Math.pow((step - FAST) / SLOW, 2) * 300);
      } else {
        setDisplayedCategory(picked.category); setQuestion(picked);
        timerRef.current = setTimeout(() => { setAnimState("flipping"); timerRef.current = setTimeout(() => {
          setAnimState("revealed");
          if (!coachCompletedRef.current) {
            coachCompletedRef.current = true;
            fetch("/api/weekly-coach/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action_type: "icebreaker" }) }).catch(() => {});
          }
        }, 700); }, 450);
      }
    }
    tick();
  }

  function skipCard() {
    clearTimers(); setAnimState("unflipping");
    timerRef.current = setTimeout(() => drawCard([...selectedCategories]), 700);
  }

  // Participants logic
  function addParticipant() {
    const name = participantDraft.trim();
    if (!name || participants.includes(name)) return;
    setParticipants((prev) => [...prev, name]);
    setParticipantDraft(""); participantInputRef.current?.focus();
  }

  // Derived
  const isActive   = animState === "shuffling" || animState === "flipping" || animState === "unflipping";
  const isRevealed = animState === "revealed"  || animState === "unflipping";
  const anecdotesSelectable = sessionAnecdotes.length > 0;
  const totalInPool = (() => {
    const all = [...ICEBREAKER_QUESTIONS, ...sessionAnecdotes];
    return selectedCategories.size === 0 ? all.length : all.filter((q) => selectedCategories.has(q.category)).length;
  })();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/" parentHref="/toolbox" parentLabel={t.common.miniJeux} currentTool="Icebreakers" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-5 flex flex-col lg:flex-row gap-10 items-start lg:items-center justify-center">

        {/* ── LEFT : card ───────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4 flex-shrink-0">

          {/* Heading */}
          <div className={`text-center transition-opacity duration-300 ${isRevealed ? "opacity-30 pointer-events-none select-none" : ""}`}>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5">{t.icebreaker.drawerCard}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.icebreaker.subtitle}</p>
          </div>

          {/* Pills */}
          <div className={`flex flex-col items-center gap-2 transition-opacity duration-300 ${isRevealed ? "opacity-30 pointer-events-none select-none" : ""}`}>
            <div className="flex flex-wrap justify-center gap-1.5">
              <button onClick={() => setSelectedCategories(new Set())} disabled={isActive} data-active={selectedCategories.size === 0}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors disabled:opacity-40 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 data-[active=true]:bg-gray-200 dark:data-[active=true]:bg-gray-700 data-[active=true]:border-gray-400">
                {t.icebreaker.all}
              </button>
              {CATEGORY_ORDER.filter((c) => c !== "anecdotes").map((cat) => (
                <button key={cat} onClick={() => toggleCategory(cat)} disabled={isActive} data-active={selectedCategories.has(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors disabled:opacity-40 ${PILL_CLS[cat]} data-[active=true]:ring-2 data-[active=true]:ring-offset-1 data-[active=true]:ring-current`}>
                  {ICEBREAKER_CATEGORY_LABELS[cat]}
                </button>
              ))}
              <span className="self-center w-px h-4 bg-gray-200 dark:bg-gray-700" />
              <button onClick={() => anecdotesSelectable && toggleCategory("anecdotes")} disabled={isActive || !anecdotesSelectable}
                data-active={selectedCategories.has("anecdotes")}
                title={anecdotesSelectable ? undefined : t.icebreaker.addFirst}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors disabled:opacity-40 ${PILL_CLS["anecdotes"]} data-[active=true]:ring-2 data-[active=true]:ring-offset-1 data-[active=true]:ring-current`}>
                {ICEBREAKER_CATEGORY_LABELS["anecdotes"]}
                {sessionAnecdotes.length > 0 && <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold">{sessionAnecdotes.length}</span>}
              </button>
              <button onClick={() => { setAddingAnecdote(true); setTimeout(() => inputRef.current?.focus(), 50); }} disabled={isActive}
                className="w-6 h-6 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center hover:bg-emerald-100 disabled:opacity-40">
                <Plus size={12} />
              </button>
              {sessionAnecdotes.length > 0 && (
                <button onClick={() => setAnecdotePanelOpen((v) => !v)} disabled={isActive} data-active={anecdotePanelOpen}
                  className="w-6 h-6 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center hover:bg-emerald-100 disabled:opacity-40 data-[active=true]:bg-emerald-200 dark:data-[active=true]:bg-emerald-900">
                  <List size={12} />
                </button>
              )}
            </div>

            {anecdotePanelOpen && sessionAnecdotes.length > 0 && (
              <div className="w-full max-w-xs bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-emerald-50 dark:border-emerald-900/60 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{t.icebreaker.anecdotesTab}</span>
                  <button onClick={() => setAnecdotePanelOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
                </div>
                <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                  {sessionAnecdotes.map((q) => (
                    <li key={q.id} className="px-4 py-2 flex items-start gap-2">
                      {editingId === q.id ? (
                        <>
                          <input ref={editRef} value={editDraft} onChange={(e) => setEditDraft(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") { setEditingId(null); setEditDraft(""); } }}
                            className="flex-1 text-sm px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                          <button onClick={saveEdit} className="text-emerald-600 hover:text-emerald-700"><Check size={13} /></button>
                          <button onClick={() => { setEditingId(null); setEditDraft(""); }} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
                        </>
                      ) : (
                        <>
                          <p className="flex-1 text-xs text-gray-700 dark:text-gray-300 leading-snug">{q.question}</p>
                          <button onClick={() => { setEditingId(q.id); setEditDraft(q.question); setTimeout(() => editRef.current?.focus(), 50); }} className="text-gray-400 hover:text-gray-600"><Pencil size={12} /></button>
                          <button onClick={() => deleteAnecdote(q.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {addingAnecdote && (
              <div className="flex items-center gap-2 w-full max-w-xs">
                <input ref={inputRef} value={anecdoteDraft} onChange={(e) => setAnecdoteDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitAnecdote(); if (e.key === "Escape") { setAddingAnecdote(false); setAnecdoteDraft(""); } }}
                  placeholder={t.icebreaker.anecdotePlaceholder}
                  className="flex-1 text-sm px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                <button onClick={submitAnecdote} className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700"><Check size={13} /></button>
                <button onClick={() => { setAddingAnecdote(false); setAnecdoteDraft(""); }} className="w-7 h-7 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"><X size={13} /></button>
              </div>
            )}
          </div>

          {/* Card deck */}
          <div className="relative flex items-center justify-center" style={{ width: 256, height: 285 }}>
            <div className="absolute inset-0 rounded-3xl bg-gray-300 dark:bg-gray-700 transition-transform duration-500" style={{ transform: "rotate(-5deg) translateY(6px)", zIndex: 0 }} />
            <div className="absolute inset-0 rounded-3xl bg-gray-200 dark:bg-gray-800 transition-transform duration-500" style={{ transform: "rotate(-2.5deg) translateY(3px)", zIndex: 1 }} />
            <div className="relative" style={{ zIndex: 2 }}>
              <QuestionCard displayedCategory={displayedCategory} animState={animState} question={question} />
            </div>
          </div>

          {/* Actions */}
          {isRevealed ? (
            <div className="flex gap-3">
              <button onClick={() => { clearTimers(); setAnimState("idle"); setQuestion(null); }}
                className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {t.common.restart}
              </button>
              <button onClick={skipCard} disabled={animState === "unflipping"}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                <Shuffle size={13} />{t.icebreaker.skip}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <button onClick={() => drawCard()} disabled={isActive}
                className="inline-flex items-center gap-2 px-7 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                <Shuffle size={14} className={isActive ? "animate-spin" : ""} />
                {isActive ? t.icebreaker.drawing : t.icebreaker.draw}
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500">{totalInPool} {t.icebreaker.stats}</p>
            </div>
          )}
        </div>

        {/* ── RIGHT : participants + wheel + tips ────────────────────────── */}
        <div className="flex flex-col gap-4 w-full max-w-xs">

          {/* Participants */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t.icebreaker.participants}
                {participants.length > 0 && <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] font-bold">{participants.length}</span>}
              </h2>
              {participants.length > 0 && (
                <button onClick={() => setParticipants([])} className="text-xs text-gray-400 hover:text-red-500 transition-colors">{t.common.delete}</button>
              )}
            </div>
            <div className="px-4 py-3 flex flex-col gap-2.5">
              <div className="flex gap-2">
                <input ref={participantInputRef} value={participantDraft}
                  onChange={(e) => setParticipantDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addParticipant(); }}
                  placeholder={t.icebreaker.firstNamePlaceholder}
                  className="flex-1 text-sm px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500" />
                <button onClick={addParticipant} disabled={!participantDraft.trim()}
                  className="w-8 h-8 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center hover:opacity-80 disabled:opacity-30 transition-opacity">
                  <Plus size={14} />
                </button>
              </div>
              {participants.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {participants.map((name, i) => (
                    <span key={name} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: WHEEL_COLORS[i % WHEEL_COLORS.length] }}>
                      {name}
                      <button onClick={() => setParticipants((prev) => prev.filter((p) => p !== name))}
                        className="w-3.5 h-3.5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center">
                        <X size={9} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Wheel */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.icebreaker.whoStarts}</h2>
            </div>
            <div className="px-4 py-3 flex justify-center">
              <SpinWheel allParticipants={participants} />
            </div>
          </div>

          {/* Tips — collapsed accordion at bottom */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <button onClick={() => setTipsOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {t.icebreaker.tips.title}
              {tipsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {tipsOpen && (
              <ul className="px-4 pb-3 pt-1 space-y-2 border-t border-gray-100 dark:border-gray-800">
                {TIPS.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
