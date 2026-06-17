"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { AVATAR_COLORS } from "@/lib/retrospective/types";
import { useI18n } from "@/lib/i18n";

function JoinForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode]               = useState(searchParams.get("code") ?? "");
  const [pseudo, setPseudo]           = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [joining, setJoining]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    const c = searchParams.get("code");
    if (c) setCode(c.toUpperCase());
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const upperCode = code.trim().toUpperCase();
    if (!upperCode || !pseudo.trim()) return;
    setJoining(true);
    setError(null);

    try {
      const res = await fetch(`/api/retrospective/room/${upperCode}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: pseudo.trim(), avatarColor }),
      });

      const data = await res.json() as { playerId?: string; playerSecret?: string; error?: string };

      if (!res.ok) {
        if (res.status === 404) setError(t.gameSetup.errorInvalidCode);
        else if (res.status === 409) setError(t.gameSetup.errorAlreadyStartedSession);
        else setError(data.error ?? t.gameSetup.errorConnection);
        setJoining(false);
        return;
      }

      if (!data.playerId) {
        setError(t.gameSetup.playerCreateError);
        setJoining(false);
        return;
      }

      localStorage.setItem(
        `retro_player_${upperCode}`,
        JSON.stringify({ playerId: data.playerId, playerSecret: data.playerSecret, pseudo: pseudo.trim(), avatarColor })
      );
      router.push(`/retrospective/${upperCode}/lobby`);
    } catch {
      setError(t.common.error);
      setJoining(false);
    }
  }

  const breadcrumbs = [
    { href: "/", label: t.common.home },
    { href: "/retrospective", label: t.retrospective.title },
    { label: t.retrospective.join },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} guestMode />
      <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {t.retrospective.joinSession}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.lobby.sessionCode}
              </label>
              <input
                type="text"
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                placeholder="ABC123"
                maxLength={6}
                className="w-full px-3 py-2.5 text-sm font-mono tracking-widest uppercase rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.gameSetup.firstName}
              </label>
              <input
                type="text"
                required
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder={t.gameSetup.pseudoPlaceholder}
                maxLength={20}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.gameSetup.avatarColor}
              </label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      avatarColor === color
                        ? "ring-2 ring-offset-2 ring-teal-500 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!code.trim() || !pseudo.trim() || joining}
            className="w-full py-3 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {joining && <Loader2 size={15} className="animate-spin" />}
            {joining ? t.gameSetup.connecting : t.gameSetup.joinBtn}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function RetroJoinPage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
