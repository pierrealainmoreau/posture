"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams } from "next/navigation";
import { Loader2, Check, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import type { MidYearPast, MidYearPresent, MidYearFuture, FeelingPoste, Score5 } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────

interface MidYearPublicContext {
  id: string;
  year: number;
  collaborator_submitted_at: string | null;
  collaborator_first_name: string;
  collaborator_last_name: string;
  collaborator_role: string;
  past: MidYearPast | null;
  present: MidYearPresent | null;
  future: MidYearFuture | null;
  collab_past: Partial<MidYearPast> | null;
  collab_present: Partial<MidYearPresent> | null;
  collab_future: Partial<MidYearFuture> | null;
}

// ── Constants ─────────────────────────────────────────────────────────────

const FEELING_LABELS: Record<FeelingPoste, { label: string; sub: string; color: string }> = {
  1: { label: "Je ne me sens pas bien dans mon poste", sub: "En difficulté, pas motivé, le job ne me plaît pas", color: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30" },
  2: { label: "Je me sens moyennement bien", sub: "Jours avec et sans, je ne me sens pas légitime sur tout", color: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30" },
  3: { label: "Je me sens à ma place et je monte en puissance", sub: "J'aime ce que je fais, j'apprends, je monte en compétences", color: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30" },
  4: { label: "Je me sens vraiment bon et j'adore", sub: "Je suis une référence, j'aide les autres, j'ai de l'impact", color: "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30" },
  5: { label: "Je m'ennuie, ça tourne en rond", sub: "Je n'apprends plus rien, je suis dans ma zone de confort", color: "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50" },
};

// ── Sub-components ────────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">{children}</div>}
    </div>
  );
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
  );
}

function ScoreRow({ label, value, onChange }: { label: string; value: Score5 | null; onChange: (v: Score5) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0">{label}</span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {([1, 2, 3, 4, 5] as Score5[]).map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`w-7 h-7 rounded-full text-xs font-semibold transition-all ${
              value === n
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}>{n}</button>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

type Tab = "past" | "present" | "future";

function MidYearCollabContent() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [ctx, setCtx] = useState<MidYearPublicContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("past");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Collab answers state
  const [collabPast, setCollabPast] = useState<Partial<MidYearPast>>({
    bilan_global: "",
    moments_forts: ["", "", ""],
    kifs: ["", "", ""],
    frustrations: ["", "", ""],
    objectifs_s1: [],
    apprentissages: ["", "", ""],
    manager_notes: "",
  });
  const [collabPresent, setCollabPresent] = useState<Partial<MidYearPresent>>({
    feeling_poste: null,
    entreprise_vision: null,
    entreprise_mission: null,
    entreprise_forces: null,
    entreprise_challenges: null,
    equipe_mission: null,
    equipe_forces: null,
    equipe_challenges: null,
    bien_etre_notes: "",
    manager_notes: "",
  });
  const [collabFuture, setCollabFuture] = useState<Partial<MidYearFuture>>({
    succes_si: ["", "", ""],
    daki_drop: "",
    daki_add: "",
    daki_keep: "",
    daki_improve: "",
    feedback_manager: "",
    objectifs_s2: [],
    demandes: "",
    manager_notes: "",
  });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/teams/mid-year/${token}`)
      .then(r => r.json())
      .then((data: MidYearPublicContext & { error?: string }) => {
        if (data.error) { setError(data.error); return; }
        setCtx(data);
        setSubmitted(!!data.collaborator_submitted_at);
        if (data.collab_past) setCollabPast({ ...collabPast, ...data.collab_past });
        if (data.collab_present) setCollabPresent({ ...collabPresent, ...data.collab_present });
        if (data.collab_future) setCollabFuture({ ...collabFuture, ...data.collab_future });
      })
      .catch(() => setError("Impossible de charger la page."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const autoSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/teams/mid-year/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collab_past: collabPast, collab_present: collabPresent, collab_future: collabFuture }),
      });
    }, 800);
  };

  const updatePast = (patch: Partial<MidYearPast>) => {
    setCollabPast(prev => { const next = { ...prev, ...patch }; return next; });
    autoSave();
  };
  const updatePresent = (patch: Partial<MidYearPresent>) => {
    setCollabPresent(prev => ({ ...prev, ...patch }));
    autoSave();
  };
  const updateFuture = (patch: Partial<MidYearFuture>) => {
    setCollabFuture(prev => ({ ...prev, ...patch }));
    autoSave();
  };

  const updateList = (
    field: "moments_forts" | "kifs" | "frustrations" | "apprentissages" | "succes_si",
    idx: number,
    val: string,
    section: "past" | "future",
  ) => {
    if (section === "past") {
      const arr = [...((collabPast[field as keyof MidYearPast] as string[]) ?? ["", "", ""])];
      arr[idx] = val;
      updatePast({ [field]: arr } as Partial<MidYearPast>);
    } else {
      const arr = [...((collabFuture[field as keyof MidYearFuture] as string[]) ?? ["", "", ""])];
      arr[idx] = val;
      updateFuture({ [field]: arr } as Partial<MidYearFuture>);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/mid-year/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collab_past: collabPast, collab_present: collabPresent, collab_future: collabFuture }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !ctx) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{error ?? "Lien invalide"}</p>
        </div>
      </div>
    );
  }

  const firstName = ctx.collaborator_first_name;
  const TABS = [
    { id: "past" as Tab, label: "Les 6 derniers mois" },
    { id: "present" as Tab, label: "Le présent" },
    { id: "future" as Tab, label: "Le S2" },
  ];

  const mf = (collabPast.moments_forts ?? ["", "", ""]) as string[];
  const kifs = (collabPast.kifs ?? ["", "", ""]) as string[];
  const frst = (collabPast.frustrations ?? ["", "", ""]) as string[];
  const appr = (collabPast.apprentissages ?? ["", "", ""]) as string[];
  const succ = (collabFuture.succes_si ?? ["", "", ""]) as string[];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/" currentTool="Entretien mi-année" />
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-6">

        {/* Hero */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-5 mb-5">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-0.5">
            Entretien mi-année {ctx.year}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Bonjour {firstName} — prends le temps de répondre honnêtement. Tes réponses seront partagées avec ton manager lors de l&apos;entretien.
          </p>
          {submitted && (
            <div className="mt-3 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <Check size={13} /> Réponses soumises
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                tab === t.id
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Passé ───────────────────────────────────────────────────── */}
        {tab === "past" && (
          <div className="space-y-4">
            <Section title="Bilan global des 6 derniers mois">
              <FieldLabel label="Si ces 6 mois étaient un film, ce serait lequel et pourquoi ?" />
              <Textarea value={collabPast.bilan_global ?? ""} onChange={v => updatePast({ bilan_global: v })}
                placeholder="Ex : Mission Impossible, parce que j'ai relevé des défis inattendus…" rows={3} />
            </Section>

            <Section title="Les moments forts">
              <FieldLabel label="Tes 3 grands moments forts de ces 6 derniers mois" hint="Réalisations, succès, événements marquants" />
              {[0, 1, 2].map(i => (
                <Textarea key={i} value={mf[i] ?? ""} onChange={v => updateList("moments_forts", i, v, "past")}
                  placeholder={`Moment fort ${i + 1}…`} rows={2} />
              ))}
            </Section>

            <Section title="Les kifs — ce que j'ai adoré">
              <FieldLabel label="Tes 3 principales sources de satisfaction ou fierté" />
              {[0, 1, 2].map(i => (
                <Textarea key={i} value={kifs[i] ?? ""} onChange={v => updateList("kifs", i, v, "past")}
                  placeholder={`Satisfaction ${i + 1}…`} rows={2} />
              ))}
            </Section>

            <Section title="Les frustrations">
              <FieldLabel label="Tes 3 principales frustrations ou difficultés" hint="Sois honnête — c'est l'occasion d'en parler" />
              {[0, 1, 2].map(i => (
                <Textarea key={i} value={frst[i] ?? ""} onChange={v => updateList("frustrations", i, v, "past")}
                  placeholder={`Frustration ${i + 1}…`} rows={2} />
              ))}
            </Section>

            <Section title="Les apprentissages">
              <FieldLabel label="Tes 3 principaux enseignements de ces 6 mois" />
              {[0, 1, 2].map(i => (
                <Textarea key={i} value={appr[i] ?? ""} onChange={v => updateList("apprentissages", i, v, "past")}
                  placeholder={`Enseignement ${i + 1}…`} rows={2} />
              ))}
            </Section>
          </div>
        )}

        {/* ── Présent ──────────────────────────────────────────────────── */}
        {tab === "present" && (
          <div className="space-y-4">
            <Section title="Feeling global par rapport à ton poste">
              <FieldLabel label="Aujourd'hui, tu te situes dans quelle catégorie ?" />
              <div className="space-y-2">
                {([1, 2, 3, 4, 5] as FeelingPoste[]).map(n => (
                  <button key={n} type="button" onClick={() => updatePresent({ feeling_poste: n })}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      collabPresent.feeling_poste === n
                        ? FEELING_LABELS[n].color + " border-opacity-100"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{FEELING_LABELS[n].label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{FEELING_LABELS[n].sub}</p>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="L'entreprise">
              <FieldLabel label="Évalue de 1 à 5 ta clarté sur ces éléments" hint="5 = super clair · 1 = pas du tout clair" />
              <div className="space-y-3">
                <ScoreRow label="La vision de l'entreprise (là où elle va)" value={collabPresent.entreprise_vision ?? null}
                  onChange={v => updatePresent({ entreprise_vision: v })} />
                <ScoreRow label="La mission de l'entreprise (à quoi elle sert)" value={collabPresent.entreprise_mission ?? null}
                  onChange={v => updatePresent({ entreprise_mission: v })} />
                <ScoreRow label="Les forces de l'entreprise" value={collabPresent.entreprise_forces ?? null}
                  onChange={v => updatePresent({ entreprise_forces: v })} />
                <ScoreRow label="Les challenges à relever par l'entreprise" value={collabPresent.entreprise_challenges ?? null}
                  onChange={v => updatePresent({ entreprise_challenges: v })} />
              </div>
            </Section>

            <Section title="L'équipe">
              <FieldLabel label="Évalue de 1 à 5 ta clarté sur ces éléments" hint="5 = super clair · 1 = pas du tout clair" />
              <div className="space-y-3">
                <ScoreRow label="La mission de l'équipe (à quoi elle sert, son impact)" value={collabPresent.equipe_mission ?? null}
                  onChange={v => updatePresent({ equipe_mission: v })} />
                <ScoreRow label="Les forces de notre équipe" value={collabPresent.equipe_forces ?? null}
                  onChange={v => updatePresent({ equipe_forces: v })} />
                <ScoreRow label="Les challenges à relever par l'équipe" value={collabPresent.equipe_challenges ?? null}
                  onChange={v => updatePresent({ equipe_challenges: v })} />
              </div>
            </Section>

            <Section title="Bien-être & notes libres">
              <FieldLabel label="Un mot sur comment tu te sens en ce moment ?" hint="Charge de travail, équilibre, engagement…" />
              <Textarea value={collabPresent.bien_etre_notes ?? ""} onChange={v => updatePresent({ bien_etre_notes: v })}
                placeholder="Tout ce que tu veux partager sur ton état actuel…" rows={4} />
            </Section>
          </div>
        )}

        {/* ── Futur S2 ─────────────────────────────────────────────────── */}
        {tab === "future" && (
          <div className="space-y-4">
            <Section title="Mon S2 sera réussi si…">
              <FieldLabel label="3 critères de succès pour le 2e semestre" hint="Sois précis et ambitieux" />
              {[0, 1, 2].map(i => (
                <Textarea key={i} value={succ[i] ?? ""} onChange={v => updateList("succes_si", i, v, "future")}
                  placeholder={`Critère de succès ${i + 1}…`} rows={2} />
              ))}
            </Section>

            <Section title="Mon DAKI — plan d'actions S2">
              <div className="space-y-4">
                <div>
                  <FieldLabel label="Drop — qu'est-ce que j'arrête de faire ?" hint="Des habitudes qui me font perdre du temps ou de l'énergie" />
                  <Textarea value={collabFuture.daki_drop ?? ""} onChange={v => updateFuture({ daki_drop: v })}
                    placeholder="Ex : arrêter d'aller à telle réunion qui ne m'apporte rien…" rows={3} />
                </div>
                <div>
                  <FieldLabel label="Add — qu'est-ce que je commence à faire ?" hint="De nouvelles pratiques à mettre en place" />
                  <Textarea value={collabFuture.daki_add ?? ""} onChange={v => updateFuture({ daki_add: v })}
                    placeholder="Ex : me former à tel sujet, initier tel rituel…" rows={3} />
                </div>
                <div>
                  <FieldLabel label="Keep — qu'est-ce que je continue ?" hint="Ce qui fonctionne bien et mérite d'être maintenu" />
                  <Textarea value={collabFuture.daki_keep ?? ""} onChange={v => updateFuture({ daki_keep: v })}
                    placeholder="Ex : continuer la veille hebdo, les points réguliers avec…" rows={3} />
                </div>
                <div>
                  <FieldLabel label="Improve — qu'est-ce que j'améliore ?" hint="Des choses existantes à faire mieux" />
                  <Textarea value={collabFuture.daki_improve ?? ""} onChange={v => updateFuture({ daki_improve: v })}
                    placeholder="Ex : mieux préparer les sujets avant les réunions…" rows={3} />
                </div>
              </div>
            </Section>

            <Section title="Un encore meilleur binôme">
              <FieldLabel label="Pour que l'on forme un meilleur tandem, j'aimerais que tu saches…" hint="Présence, soutien, feedback, ce que tu changerais" />
              <Textarea value={collabFuture.feedback_manager ?? ""} onChange={v => updateFuture({ feedback_manager: v })}
                placeholder="Suis-je assez présent ? Qu'est-ce qui te surprend positivement ? Ce que tu ferais différemment ?…" rows={5} />
            </Section>

            <Section title="Mes demandes">
              <FieldLabel label="As-tu des demandes pour moi pour le S2 ?" hint="Formations, nouvelles missions, changements souhaités…" />
              <Textarea value={collabFuture.demandes ?? ""} onChange={v => updateFuture({ demandes: v })}
                placeholder="Formations souhaitées, nouvelles envies, sujets sur lesquels tu veux progresser…" rows={4} />
            </Section>
          </div>
        )}

        {/* Nav + Submit */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {tab !== "past" && (
              <button type="button" onClick={() => setTab(tab === "future" ? "present" : "past")}
                className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Précédent
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {tab !== "future" ? (
              <button type="button" onClick={() => setTab(tab === "past" ? "present" : "future")}
                className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 transition-opacity">
                Suivant
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={saving || submitted}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-700 text-white rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {submitted ? "Soumis" : "Soumettre mes réponses"}
              </button>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

export default function MidYearCollabPage() {
  return (
    <Suspense>
      <MidYearCollabContent />
    </Suspense>
  );
}

// Suppress unused import warnings
const _unused = { Plus, Trash2 };
void _unused;
