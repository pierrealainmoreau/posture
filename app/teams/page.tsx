"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Users, Plus, Loader2, ChevronRight, Crown, Lock, Check,
  BookOpen, Sparkles, Calendar, Target, FileText,
} from "lucide-react";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import type { Collaborator, CoachSeniority, CollaboratorPeriod } from "@/lib/types";
import {
  COACH_COLLAB_LIMITS,
  COLLABORATOR_PERIOD_LABELS,
  COACH_SENIORITY_LABELS,
} from "@/lib/types";

const SENIORITY_OPTIONS: CoachSeniority[] = ["junior", "confirmed", "senior"];
const PERIOD_OPTIONS: CollaboratorPeriod[] = ["onboarding", "development", "retention"];

const SENIORITY_COLORS: Record<CoachSeniority, string> = {
  junior:    "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  confirmed: "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  senior:    "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
};

const SENIORITY_RING: Record<CoachSeniority, string> = {
  junior:    "ring-blue-200 dark:ring-blue-800",
  confirmed: "ring-violet-200 dark:ring-violet-800",
  senior:    "ring-amber-200 dark:ring-amber-800",
};

const PERIOD_COLORS: Record<CollaboratorPeriod, string> = {
  onboarding:  "text-teal-600 dark:text-teal-400",
  development: "text-blue-600 dark:text-blue-400",
  retention:   "text-violet-600 dark:text-violet-400",
};

interface AddForm {
  first_name: string;
  last_name: string;
  role: string;
  seniority: CoachSeniority;
  period: CollaboratorPeriod;
  relationship_started_at: string;
  current_ops_topics: string;
}

const EMPTY_FORM: AddForm = {
  first_name: "",
  last_name: "",
  role: "",
  seniority: "confirmed",
  period: "development",
  relationship_started_at: new Date().toISOString().slice(0, 10),
  current_ops_topics: "",
};

interface CollabProgress {
  manualCompleted: boolean;
  hasPlan: boolean;
  sessionCount: number;
  hasOkr: boolean;
}

const STEPS: { key: keyof CollabProgress | "sessions"; label: string; icon: React.ReactNode }[] = [
  {
    key: "manualCompleted",
    label: "Guide utilisateur complété",
    icon: <BookOpen size={12} />,
  },
  {
    key: "hasPlan",
    label: "Plan managérial généré",
    icon: <Sparkles size={12} />,
  },
  {
    key: "sessions",
    label: "Session 1:1 organisée",
    icon: <Calendar size={12} />,
  },
  {
    key: "hasOkr",
    label: "Objectifs OKR définis",
    icon: <Target size={12} />,
  },
];

function stepDone(prog: CollabProgress, key: string): boolean {
  if (key === "sessions") return prog.sessionCount > 0;
  return prog[key as keyof CollabProgress] as boolean;
}

function progressPct(prog: CollabProgress): number {
  const done = STEPS.filter((s) => stepDone(prog, s.key)).length;
  return Math.round((done / STEPS.length) * 100);
}

function progressBarColor(pct: number): string {
  if (pct === 100) return "bg-green-500";
  if (pct >= 50)   return "bg-blue-500";
  if (pct > 0)     return "bg-amber-400";
  return "bg-gray-200 dark:bg-gray-700";
}

function initials(c: Collaborator) {
  return ((c.first_name[0] ?? "") + (c.last_name[0] ?? "")).toUpperCase() || "?";
}

export default function CoachPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [progress, setProgress] = useState<Record<string, CollabProgress>>({});
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AddForm>(EMPTY_FORM);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setForm(EMPTY_FORM);
      setAdding(true);
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [searchParams]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }

      const [collabsRes, profileRes] = await Promise.all([
        supabase.from("collaborators").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("profiles").select("is_premium").eq("id", user.id).single<{ is_premium: boolean }>(),
      ]);

      const collabs = (collabsRes.data as Collaborator[]) ?? [];
      setCollaborators(collabs);
      setIsPremium(profileRes.data?.is_premium ?? false);
      setLoading(false);

      if (collabs.length === 0) { setProgressLoading(false); return; }

      const ids = collabs.map((c) => c.id);

      // Batch load: plans, sessions, manuals, company OKR
      const [plansRes, sessionsRes, manualsRes, companyOkrRes] = await Promise.all([
        supabase.from("managerial_plans").select("collaborator_id").in("collaborator_id", ids),
        supabase.from("weekly_sessions").select("collaborator_id").in("collaborator_id", ids),
        supabase.from("collaborator_manuals").select("collaborator_id, completed_at").in("collaborator_id", ids).eq("user_id", user.id),
        supabase.from("company_okrs").select("id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle<{ id: string }>(),
      ]);

      const planIds = new Set<string>((plansRes.data ?? []).map((r: { collaborator_id: string }) => r.collaborator_id));
      const sessionCounts: Record<string, number> = {};
      for (const r of (sessionsRes.data ?? []) as { collaborator_id: string }[]) {
        sessionCounts[r.collaborator_id] = (sessionCounts[r.collaborator_id] ?? 0) + 1;
      }
      const manualDone = new Set<string>(
        ((manualsRes.data ?? []) as { collaborator_id: string; completed_at: string | null }[])
          .filter((r) => r.completed_at)
          .map((r) => r.collaborator_id)
      );

      let okrIds = new Set<string>();
      const companyOkrId = companyOkrRes.data?.id;
      if (companyOkrId) {
        const okrsRes = await supabase
          .from("collaborator_okrs")
          .select("collaborator_id")
          .in("collaborator_id", ids)
          .eq("company_okr_id", companyOkrId);
        okrIds = new Set<string>(((okrsRes.data ?? []) as { collaborator_id: string }[]).map((r) => r.collaborator_id));
      }

      const map: Record<string, CollabProgress> = {};
      for (const c of collabs) {
        map[c.id] = {
          manualCompleted: manualDone.has(c.id),
          hasPlan: planIds.has(c.id),
          sessionCount: sessionCounts[c.id] ?? 0,
          hasOkr: okrIds.has(c.id),
        };
      }
      setProgress(map);
      setProgressLoading(false);
    });
  }, [router]);

  function openForm() {
    setForm(EMPTY_FORM);
    setAdding(true);
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }

  async function saveCollaborator() {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.role.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const { data, error } = await supabase
      .from("collaborators")
      .insert({
        user_id: user.id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        role: form.role.trim(),
        seniority: form.seniority,
        period: form.period,
        relationship_started_at: form.relationship_started_at,
        current_ops_topics: form.current_ops_topics.trim() || null,
      })
      .select("*")
      .single<Collaborator>();

    setSaving(false);
    if (error || !data) return;
    setCollaborators((prev) => [...prev, data]);
    setProgress((prev) => ({
      ...prev,
      [data.id]: { manualCompleted: false, hasPlan: false, sessionCount: 0, hasOkr: false },
    }));
    setAdding(false);
  }

  const limit = isPremium ? COACH_COLLAB_LIMITS.premium : COACH_COLLAB_LIMITS.free;
  const isAtLimit = collaborators.length >= limit;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/" currentTool="Mon Équipe" />
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/" currentTool="Mon Équipe" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center">
              <Users size={18} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Mon Équipe</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {collaborators.length === 0
                  ? "Aucun membre pour l'instant"
                  : `${collaborators.length} membre${collaborators.length > 1 ? "s" : ""}`}
                {!isPremium && ` · plan gratuit (${collaborators.length}/${limit})`}
              </p>
            </div>
          </div>
          <button
            onClick={isAtLimit ? undefined : openForm}
            disabled={isAtLimit}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-opacity ${
              isAtLimit
                ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed opacity-60"
                : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90"
            }`}
          >
            {isAtLimit ? <Lock size={14} /> : <Plus size={14} />}
            Ajouter un membre
          </button>
        </div>

        {/* Add form */}
        {adding && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-8">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Nouveau membre</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prénom</label>
                  <input ref={firstInputRef} value={form.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    placeholder="Marie"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom</label>
                  <input value={form.last_name}
                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                    placeholder="Dupont"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rôle</label>
                <input value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  placeholder="ex. Développeur frontend"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Séniorité</label>
                <div className="flex gap-2">
                  {SENIORITY_OPTIONS.map((s) => (
                    <button key={s} onClick={() => setForm((f) => ({ ...f, seniority: s }))}
                      className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-colors ${
                        form.seniority === s
                          ? "border-green-500 bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300"
                          : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                      }`}>
                      {COACH_SENIORITY_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phase</label>
                <div className="flex gap-2">
                  {PERIOD_OPTIONS.map((p) => (
                    <button key={p} onClick={() => setForm((f) => ({ ...f, period: p }))}
                      className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-colors ${
                        form.period === p
                          ? "border-green-500 bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300"
                          : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                      }`}>
                      {COLLABORATOR_PERIOD_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date de début</label>
                  <input type="date" value={form.relationship_started_at}
                    onChange={(e) => setForm((f) => ({ ...f, relationship_started_at: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sujets en cours</label>
                  <input value={form.current_ops_topics}
                    onChange={(e) => setForm((f) => ({ ...f, current_ops_topics: e.target.value }))}
                    placeholder="ex. montée en charge, projet X"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={saveCollaborator}
                  disabled={saving || !form.first_name.trim() || !form.last_name.trim() || !form.role.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {saving ? "Enregistrement…" : "Ajouter à l'équipe"}
                </button>
                <button onClick={() => setAdding(false)}
                  className="px-5 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {collaborators.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950 flex items-center justify-center mb-5">
              <Users size={28} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Votre équipe vous attend</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
              Ajoutez les membres de votre équipe pour accéder au Coach 1:1, générer un plan managérial et suivre vos objectifs.
            </p>
            <button onClick={openForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 transition-opacity">
              <Plus size={15} /> Ajouter le premier membre
            </button>
          </div>
        )}

        {/* Collaborator cards */}
        {collaborators.length > 0 && (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {collaborators.map((c) => {
              const prog = progress[c.id];
              const pct = prog ? progressPct(prog) : 0;
              const barColor = progressBarColor(pct);
              const doneSessions = prog?.sessionCount ?? 0;

              return (
                <Link
                  key={c.id}
                  href={`/teams/${c.id}`}
                  className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all block"
                >
                  {/* Member header */}
                  <div className="flex items-start gap-3 mb-5">
                    <div className={`w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 ring-2 ${SENIORITY_RING[c.seniority]}`}>
                      <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold">{initials(c)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {c.first_name} {c.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.role}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${SENIORITY_COLORS[c.seniority]}`}>
                          {COACH_SENIORITY_LABELS[c.seniority]}
                        </span>
                        <span className={`text-xs font-medium ${PERIOD_COLORS[c.period]}`}>
                          {COLLABORATOR_PERIOD_LABELS[c.period]}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={15} className="flex-shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors mt-1" />
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Progression coach</span>
                      {progressLoading && !prog ? (
                        <Loader2 size={10} className="animate-spin text-gray-400" />
                      ) : (
                        <span className={`text-xs font-semibold tabular-nums ${
                          pct === 100 ? "text-green-600 dark:text-green-400" :
                          pct >= 50   ? "text-blue-600 dark:text-blue-400" :
                          pct > 0     ? "text-amber-600 dark:text-amber-400" :
                                        "text-gray-400"
                        }`}>{pct}%</span>
                      )}
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Steps checklist */}
                  <div className="space-y-1.5">
                    {STEPS.map((step) => {
                      const done = prog ? stepDone(prog, step.key) : false;
                      const label = step.key === "sessions" && doneSessions > 0
                        ? `${doneSessions} session${doneSessions > 1 ? "s" : ""} 1:1 organisée${doneSessions > 1 ? "s" : ""}`
                        : step.label;
                      return (
                        <div key={step.key as string} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                            done
                              ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600"
                          }`}>
                            {done ? <Check size={9} /> : step.icon}
                          </div>
                          <span className={`text-xs transition-colors ${
                            done
                              ? "text-gray-700 dark:text-gray-300"
                              : "text-gray-400 dark:text-gray-500"
                          }`}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* CTA Synthèse managériale */}
          <div className="mt-6 flex items-center justify-between gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <FileText size={15} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Synthèse managériale</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                  Générer une note à remonter à ta hiérarchie
                </p>
              </div>
            </div>
            <Link
              href="/synthese"
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
            >
              <Sparkles size={12} /> Générer
            </Link>
          </div>
          </>
        )}

        {/* Premium upsell */}
        {!isPremium && collaborators.length >= 2 && (
          <div className="mt-8 flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                <Crown size={14} /> Plan gratuit — {collaborators.length}/{limit} membres
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Passez en premium pour gérer jusqu&apos;à {COACH_COLLAB_LIMITS.premium} membres.
              </p>
            </div>
            <Link href="/premium"
              className="px-3 py-1.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-200 transition-colors">
              Voir les offres
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}
