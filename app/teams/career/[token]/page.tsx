"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { Loader2, Check, ChevronDown } from "lucide-react";
import { Header } from "@/components/Header";
import type { CareerPath, CareerSkill, ExpertiseLevel, CareerSelfLevels } from "@/lib/types";
import { LEVELS } from "@/lib/types";

const LEVEL_LABELS: Record<ExpertiseLevel, string> = {
  "débutant": "Débutant",
  "intermédiaire": "Intermédiaire",
  "avancé": "Avancé",
  "expert": "Expert",
};

const DOT_FILL_COLLAB = ["bg-gray-400", "bg-green-400", "bg-green-500", "bg-emerald-500"];

function SelfSkillRow({
  skill,
  selfLevel,
  onUpdate,
}: {
  skill: CareerSkill;
  selfLevel: ExpertiseLevel | undefined;
  onUpdate: (level: ExpertiseLevel) => void;
}) {
  const selfIdx = selfLevel ? LEVELS.indexOf(selfLevel) : -1;

  return (
    <div className="py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 min-w-0">{skill.skill}</span>
        <div className="flex items-center gap-1.5">
          {LEVELS.map((level, i) => (
            <button
              key={level}
              onClick={() => onUpdate(level)}
              title={LEVEL_LABELS[level]}
              className={[
                "w-5 h-5 rounded-full transition-all hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500",
                i <= selfIdx ? (DOT_FILL_COLLAB[selfIdx] ?? "bg-green-400") : "bg-gray-100 dark:bg-gray-800",
              ].join(" ")}
            />
          ))}
        </div>
        <span className="text-xs font-medium w-24 text-right text-green-600 dark:text-green-400">
          {selfLevel ? LEVEL_LABELS[selfLevel] : <span className="text-gray-400">Non évalué</span>}
        </span>
      </div>
    </div>
  );
}

function SkillSection({
  title,
  skills,
  selfLevels,
  onUpdate,
  defaultOpen,
}: {
  title: string;
  skills: CareerSkill[];
  selfLevels: CareerSelfLevels;
  onUpdate: (skillName: string, level: ExpertiseLevel) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const filled = skills.filter((s) => selfLevels[s.skill]).length;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {filled > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {filled}/{skills.length}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-800">
          {skills.map((skill) => (
            <SelfSkillRow
              key={skill.skill}
              skill={skill}
              selfLevel={selfLevels[skill.skill]}
              onUpdate={(level) => onUpdate(skill.skill, level)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FillCareerContent() {
  const params = useParams<{ token: string }>();

  const [collaboratorName, setCollaboratorName] = useState<string | null>(null);
  const [careerPath, setCareerPath] = useState<CareerPath | null>(null);
  const [selfLevels, setSelfLevels] = useState<CareerSelfLevels>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyFilled, setAlreadyFilled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/teams/career/fill/${params.token}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); setLoading(false); return; }
        if (!res.ok) { setError("Une erreur est survenue."); setLoading(false); return; }
        const data = await res.json();
        setCollaboratorName(`${data.collaborator_first_name} ${data.collaborator_last_name}`.trim());
        setCareerPath(data.career_path);
        setSelfLevels(data.self_levels ?? {});
        setAlreadyFilled(!!data.completed_at);
        setLoading(false);
      })
      .catch(() => { setError("Une erreur est survenue."); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  function handleUpdate(skillName: string, level: ExpertiseLevel) {
    setSelfLevels((prev) => ({ ...prev, [skillName]: level }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/career/fill/${params.token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ self_levels: selfLevels }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Une erreur est survenue.");
      }
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  const allSkills = [
    ...(careerPath?.soft_skills ?? []),
    ...(careerPath?.hard_skills ?? []),
  ];
  const filledCount = allSkills.filter((s) => selfLevels[s.skill]).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header guestMode />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Lien introuvable
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            Ce lien d&apos;auto-évaluation n&apos;existe pas ou a expiré.
          </p>
        </div>
      </div>
    );
  }

  if (!careerPath) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header guestMode />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-4xl mb-4">📋</p>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucune fiche carrière disponible
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            Ton manager n&apos;a pas encore généré de fiche carrière. Réessaie plus tard.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header guestMode />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950 flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-green-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Auto-évaluation envoyée !
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            Ton manager peut maintenant voir ta propre vision de tes compétences à côté de la sienne.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header guestMode />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            {alreadyFilled ? "Mettre à jour mon auto-évaluation" : "Mon auto-évaluation"}
          </h1>
          {collaboratorName && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{collaboratorName}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed max-w-lg">
            Évalue ton niveau actuel sur chaque compétence.{" "}
            Ton manager pourra comparer ta perception avec la sienne pour orienter vos échanges.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${allSkills.length > 0 ? Math.round((filledCount / allSkills.length) * 100) : 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {filledCount}/{allSkills.length} évaluées
            </span>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-green-400 inline-block" /> Mon niveau actuel
          </span>
        </div>

        <div className="space-y-3">
          <SkillSection
            title="Soft skills"
            skills={careerPath.soft_skills}
            selfLevels={selfLevels}
            onUpdate={handleUpdate}
            defaultOpen
          />
          <SkillSection
            title="Hard skills"
            skills={careerPath.hard_skills}
            selfLevels={selfLevels}
            onUpdate={handleUpdate}
          />
        </div>

        {error && (
          <div className="mt-5 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitting || filledCount === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-2xl hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {submitting
              ? "Envoi en cours…"
              : alreadyFilled
              ? "Mettre à jour"
              : "Envoyer mon auto-évaluation"}
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Tu peux revenir sur ce lien pour modifier ton évaluation.
          </p>
        </div>

      </main>
    </div>
  );
}

export default function FillCareerPage() {
  return (
    <Suspense>
      <FillCareerContent />
    </Suspense>
  );
}
