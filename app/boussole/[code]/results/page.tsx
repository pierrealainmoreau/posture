"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Header } from "@/components/Header";
import { useI18n } from "@/lib/i18n";
import { ContinueSessionButton } from "@/components/ContinueSessionButton";

// ── Types ──────────────────────────────────────────────────────────────────────
type ProfilId = "pilote" | "dynamo" | "socle" | "repere";

interface BoussouleRoom {
  id: string;
  code: string;
  host_player_id: string;
  status: "lobby" | "playing" | "finished";
  situation_count: number;
  situation_ids: string[];
}

interface BoussoulePlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  finished_at: string | null;
}

type BoussoleScoringResult = {
  playerId: string;
  scores: Record<ProfilId, number>;
  primaryProfile: ProfilId;
  secondaryProfile: ProfilId;
};

type TeamMap = {
  distribution: Record<ProfilId, number>;
  dominant: ProfilId;
  absent: ProfilId[];
  insight: string;
};

// ── Static visual data (color + emoji, language-independent) ──────────────────
const PROFIL_VISUALS: Record<ProfilId, { color: string; emoji: string }> = {
  pilote:  { color: "#E85D4A", emoji: "🔴" },
  dynamo:  { color: "#F5C842", emoji: "🟡" },
  socle:   { color: "#4CAF82", emoji: "🟢" },
  repere:  { color: "#4A90D9", emoji: "🔵" },
};

const PROFIL_ORDER: ProfilId[] = ["pilote", "dynamo", "socle", "repere"];

// ── DonutChart ─────────────────────────────────────────────────────────────────
function DonutChart({ scores }: { scores: Record<ProfilId, number> }) {
  const [animated, setAnimated] = useState(false);
  const total = PROFIL_ORDER.reduce((s, k) => s + (scores[k] ?? 0), 0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const cx = 100, cy = 100;
  const outerR = 80, innerR = 52;
  const strokeWidth = outerR - innerR;
  const circumference = 2 * Math.PI * outerR;

  let offset = 0;
  const segments: { profilId: ProfilId; dasharray: string; dashoffset: number; color: string }[] = [];

  for (const profilId of PROFIL_ORDER) {
    const val = scores[profilId] ?? 0;
    const proportion = total > 0 ? val / total : 0.25;
    const segLen = proportion * circumference;
    const gap = circumference - segLen;
    const dashoffset = -offset;
    segments.push({
      profilId,
      dasharray: `${animated ? segLen : 0} ${animated ? gap : circumference}`,
      dashoffset,
      color: PROFIL_VISUALS[profilId].color,
    });
    offset += segLen;
  }

  return (
    <svg
      viewBox="0 0 200 200"
      width={200}
      height={200}
      className="rotate-[-90deg]"
      style={{ overflow: "visible" }}
    >
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      {segments.map(({ profilId, dasharray, dashoffset, color }) => (
        <circle
          key={profilId}
          cx={cx} cy={cy} r={outerR}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={dasharray}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dasharray 1s ease" }}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

// ── Accordion ─────────────────────────────────────────────────────────────────
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        {title}
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-300">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const code = (params?.code as string ?? "").toUpperCase();

  const [identity, setIdentity] = useState<{ playerId: string; pseudo: string } | null>(null);
  const [room, setRoom] = useState<BoussouleRoom | null>(null);
  const [players, setPlayers] = useState<BoussoulePlayer[]>([]);
  const [results, setResults] = useState<BoussoleScoringResult[]>([]);
  const [teamMap, setTeamMap] = useState<TeamMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"individuel" | "equipe">("individuel");

  const breadcrumbs = [
    { href: "/boussole", label: "Boussole" },
    { label: t.boussole.results },
  ];

  useEffect(() => {
    if (!code) return;
    const raw = localStorage.getItem(`boussole_player_${code}`);
    if (raw) {
      try { setIdentity(JSON.parse(raw) as { playerId: string; pseudo: string }); }
      catch { /* ignore */ }
    }
  }, [code]);

  useEffect(() => {
    if (!code) return;
    async function fetchAll() {
      try {
        const [roomRes, resultsRes] = await Promise.all([
          fetch(`/api/boussole/room/${code}`),
          fetch(`/api/boussole/room/${code}/results`),
        ]);
        if (!roomRes.ok || !resultsRes.ok) {
          setError(t.boussole.loadError);
          return;
        }
        const roomData = await roomRes.json() as BoussouleRoom & { players: BoussoulePlayer[] };
        const resultsData = await resultsRes.json() as { results: BoussoleScoringResult[]; teamMap: TeamMap };
        setRoom(roomData);
        setPlayers(roomData.players ?? []);
        setResults(resultsData.results ?? []);
        setTeamMap(resultsData.teamMap ?? null);
      } catch {
        setError(t.common.error);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const isHost = players.find((p) => p.id === identity?.playerId)?.is_host ?? false;
  const myResult = results.find((r) => r.playerId === identity?.playerId);
  const primaryProfile = myResult?.primaryProfile;
  const secondaryProfile = myResult?.secondaryProfile;
  const myScores = myResult?.scores ?? { pilote: 0, dynamo: 0, socle: 0, repere: 0 };

  function DistributionBar() {
    if (!teamMap) return null;
    const total = Object.values(teamMap.distribution).reduce((s, v) => s + v, 0);
    return (
      <div className="flex flex-col gap-3">
        <div className="flex h-5 rounded-full overflow-hidden w-full">
          {PROFIL_ORDER.filter((p) => (teamMap.distribution[p] ?? 0) > 0).map((p) => {
            const pct = total > 0 ? ((teamMap.distribution[p] ?? 0) / total) * 100 : 0;
            return (
              <div key={p} className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: PROFIL_VISUALS[p].color }} />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3">
          {PROFIL_ORDER.map((p) => {
            const count = teamMap.distribution[p] ?? 0;
            if (count === 0) return null;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={p} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PROFIL_VISUALS[p].color }} />
                <span>{t.boussole.profils[p].name}</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header guestMode />
        <main className="flex-1 flex items-center justify-center px-6">
          <p className="text-red-500">{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />

      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-lg flex flex-col gap-6">

          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 gap-1">
            {(["individuel", "equipe"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === tab
                    ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {tab === "individuel" ? t.boussole.myCompass : t.boussole.ourTeam}
              </button>
            ))}
          </div>

          {/* ── Tab: My compass ──────────────────────────────────────────── */}
          {activeTab === "individuel" && myResult && primaryProfile && secondaryProfile && (
            <div className="flex flex-col items-center gap-6">

              <div className="relative flex items-center justify-center w-[200px] h-[200px]">
                <DonutChart scores={myScores} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">{PROFIL_VISUALS[primaryProfile].emoji}</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-1">
                  {t.boussole.primaryProfileLabel}
                </p>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {t.boussole.profils[primaryProfile].name}
                </h2>
                <p className="text-base text-gray-500 dark:text-gray-400 italic">
                  {t.boussole.profils[primaryProfile].tagline}
                </p>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                <span className="text-lg">{PROFIL_VISUALS[secondaryProfile].emoji}</span>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t.boussole.secondaryProfileLabel}</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {t.boussole.profils[secondaryProfile].name}
                  </p>
                </div>
              </div>

              <div className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2">
                {PROFIL_ORDER.map((p) => {
                  const total = Object.values(myScores).reduce((s, v) => s + v, 0);
                  const pct = total > 0 ? Math.round(((myScores[p] ?? 0) / total) * 100) : 0;
                  return (
                    <div key={p} className="flex items-center gap-3">
                      <span className="text-xs w-20 text-gray-500 dark:text-gray-400 truncate">
                        {t.boussole.profils[p].name}
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: PROFIL_VISUALS[p].color }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              <div className="w-full flex flex-col gap-2">
                <Accordion title={t.boussole.myForces}>
                  <ul className="list-disc list-inside space-y-1">
                    {t.boussole.profils[primaryProfile].forces.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </Accordion>
                <Accordion title={t.boussole.myVigilances}>
                  <ul className="list-disc list-inside space-y-1">
                    {t.boussole.profils[primaryProfile].vigilances.map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </Accordion>
                <Accordion title={t.boussole.howICollaborate}>
                  <p>{t.boussole.profils[primaryProfile].collaboreAvec}</p>
                </Accordion>
              </div>
            </div>
          )}

          {activeTab === "individuel" && !myResult && (
            <div className="text-center text-gray-400 dark:text-gray-500 py-12">
              <p>{t.boussole.noResultsYet}</p>
            </div>
          )}

          {/* ── Tab: Our team ─────────────────────────────────────────────── */}
          {activeTab === "equipe" && (
            <div className="flex flex-col gap-6">

              <div className="flex flex-wrap justify-center gap-4">
                {players.map((p) => {
                  const playerResult = results.find((r) => r.playerId === p.id);
                  const profColor = playerResult ? PROFIL_VISUALS[playerResult.primaryProfile].color : p.avatar_color;
                  return (
                    <div key={p.id} className="flex flex-col items-center gap-1">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: profColor }}
                      >
                        {p.pseudo[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[64px] truncate text-center">
                        {p.pseudo}
                      </span>
                      {playerResult && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {PROFIL_VISUALS[playerResult.primaryProfile].emoji}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {teamMap && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                    {t.boussole.profileDistribution}
                  </p>
                  <DistributionBar />
                </div>
              )}

              {teamMap?.insight && (
                <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-xl p-4">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 italic text-center leading-relaxed">
                    {teamMap.insight}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {players.map((p) => {
                  const pr = results.find((r) => r.playerId === p.id);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: pr ? PROFIL_VISUALS[pr.primaryProfile].color : p.avatar_color }}
                      >
                        {p.pseudo[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{p.pseudo}</p>
                        {pr ? (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {t.boussole.profils[pr.primaryProfile].name} + {t.boussole.profils[pr.secondaryProfile].name}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-500">{t.boussole.pendingResults}</p>
                        )}
                      </div>
                      {pr && <span className="text-lg">{PROFIL_VISUALS[pr.primaryProfile].emoji}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Continuer la session multi-jeux ──────────────────────────── */}
          <ContinueSessionButton gameType="boussole" roomCode={code} />

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push("/boussole/create")}
              className="flex-1 py-3 text-sm font-semibold rounded-xl border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            >
              {t.boussole.playAgain}
            </button>
            <button
              onClick={() => { if (isHost) router.push("/boussole"); else window.close(); }}
              className="flex-1 py-3 text-sm font-semibold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {t.boussole.leave}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
