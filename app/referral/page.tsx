"use client";

import { useEffect, useState } from "react";
import { Copy, CheckCheck, Users, Gift, Share2 } from "lucide-react";
import { Header } from "@/components/Header";

const GOAL = 3;

interface Invited {
  first_name: string;
  created_at: string;
}

interface ReferralData {
  referral_code: string | null;
  referral_count: number;
  invited: Invited[];
}

function StepGauge({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0">
      {Array.from({ length: GOAL }).map((_, i) => {
        const done = i < count;
        const isLast = i === GOAL - 1;
        return (
          <div key={i} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 ${
              done
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600"
            }`}>
              {done ? (
                <CheckCheck size={16} />
              ) : (
                <span className="text-sm font-semibold">{i + 1}</span>
              )}
            </div>
            {!isLast && (
              <div className={`h-0.5 w-12 transition-all duration-500 ${
                i < count - 1 ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ReferralPage() {
  const [data, setData]     = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .catch(() => {});
  }, []);

  const referralUrl = data?.referral_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${data.referral_code}`
    : null;

  async function handleCopy() {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  }

  async function handleShare() {
    if (!referralUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Posture — La 3ème main du manager",
          text: "Je t'invite à essayer Posture : accès gratuit pendant 2 mois pendant la Bêta !",
          url: referralUrl,
        });
      } catch { /* cancelled */ }
      return;
    }
    handleCopy();
  }

  const count = data?.referral_count ?? 0;
  const done  = count >= GOAL;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/" currentTool="Parrainage" />

      <main className="flex-1 max-w-xl mx-auto w-full px-5 pt-8 pb-16 space-y-6">

        {/* ── Hero ── */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 mb-3">
            Offre Bêta exclusive
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invitez vos amis managers
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Partagez votre lien personnel. Pour chaque ami qui rejoint Posture,
            vous avancez vers <strong className="text-gray-700 dark:text-gray-300">3 mois gratuits</strong> à la fin de la Bêta.
          </p>
        </div>

        {/* ── Lien de parrainage ── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Votre lien personnel
          </p>
          {referralUrl ? (
            <>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                <span className="flex-1 text-xs font-mono text-gray-600 dark:text-gray-300 truncate">
                  {referralUrl}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {copied ? <CheckCheck size={15} className="text-emerald-500" /> : <Copy size={15} />}
                  {copied ? "Lien copié !" : "Copier le lien"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Share2 size={15} />
                  Partager
                </button>
              </div>
            </>
          ) : (
            <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          )}
        </div>

        {/* ── Jauge ── */}
        <div className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 ${
          done ? "border-blue-300 dark:border-blue-700" : "border-gray-200 dark:border-gray-800"
        }`}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Progression
            </p>
            <span className={`text-sm font-bold tabular-nums ${
              done ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
            }`}>
              {count} / {GOAL}
            </span>
          </div>

          <div className="flex justify-center mb-5">
            <StepGauge count={count} />
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {done
              ? "🎉 Objectif atteint ! Votre récompense est réservée."
              : count === 0
                ? "Partagez votre lien pour commencer"
                : `Encore ${GOAL - count} invitation${GOAL - count > 1 ? "s" : ""} pour débloquer la récompense`}
          </p>
        </div>

        {/* ── Récompense ── */}
        <div className={`rounded-2xl p-5 border ${
          done
            ? "bg-blue-600 border-blue-600 text-white"
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              done ? "bg-white/20" : "bg-blue-50 dark:bg-blue-950"
            }`}>
              <Gift size={20} className={done ? "text-white" : "text-blue-600 dark:text-blue-400"} />
            </div>
            <div>
              <p className={`text-sm font-semibold mb-1 ${
                done ? "text-white" : "text-gray-900 dark:text-white"
              }`}>
                3 mois gratuits à la fin de la Bêta
              </p>
              <p className={`text-xs leading-relaxed ${
                done ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
              }`}>
                {done
                  ? "La récompense sera appliquée automatiquement sur votre compte lorsque la Bêta se terminera le 31 août."
                  : "Invitez 3 amis managers pour débloquer 3 mois d'accès premium offerts quand Posture passera en version payante."}
              </p>
            </div>
          </div>
        </div>

        {/* ── Amis invités ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Amis invités
            </h2>
          </div>

          {!data ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : data.invited.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl px-5 py-8 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Personne n&apos;a encore rejoint via votre lien
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
              {data.invited.map((inv, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-sm font-bold flex-shrink-0">
                    {inv.first_name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {inv.first_name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      A rejoint le{" "}
                      {new Date(inv.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
