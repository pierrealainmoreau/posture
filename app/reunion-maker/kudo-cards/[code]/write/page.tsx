"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ChevronDown, ChevronUp, Send, Sparkles, Eye } from "lucide-react";
import { Header } from "@/components/Header";
import { KUDO_CATEGORIES, type KudoRoom, type KudoPlayer, type KudoCategory } from "@/lib/kudo-cards/types";

interface CardForm {
  category: string;
  message: string;
  sending: boolean;
  error: string | null;
  open: boolean;
}

export default function KudoWritePage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]         = useState<string>("");
  const [playerSecret, setPlayerSecret] = useState<string>("");
  const [isHost, setIsHost]             = useState(false);
  const [players, setPlayers]           = useState<KudoPlayer[]>([]);
  const [authorsCount, setAuthorsCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [revealing, setRevealing]       = useState(false);
  const [revealError, setRevealError]   = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [isDark, setIsDark]             = useState(false);

  // sent: set of recipientIds
  const [sentTo, setSentTo]   = useState<Set<string>>(new Set());
  // forms: one per recipient
  const [forms, setForms]     = useState<Record<string, CardForm>>({});

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains('dark'));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(`kudo_player_${upperCode}`);
    if (!stored) { router.replace(`/reunion-maker/kudo-cards/join?code=${upperCode}`); return; }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");

      // Restore sent cards from localStorage
      const sentRaw = localStorage.getItem(`kudo_sent_${upperCode}_${pid}`);
      if (sentRaw) setSentTo(new Set(JSON.parse(sentRaw) as string[]));
    } catch {
      router.replace(`/reunion-maker/kudo-cards/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // Poll room every 2s
  useEffect(() => {
    if (!playerId) return;

    async function fetchRoom() {
      const res = await fetch(`/api/kudo-cards/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as KudoRoom & { players: KudoPlayer[]; authors_count?: number };

      if (data.status === "lobby") { router.replace(`/reunion-maker/kudo-cards/${upperCode}/lobby`); return; }
      if (data.status === "revealed") { router.push(`/reunion-maker/kudo-cards/${upperCode}/wall`); return; }

      const allPlayers = data.players ?? [];
      const teammates = allPlayers.filter((p) => p.id !== playerId);

      setPlayers(teammates);
      setTotalPlayers(allPlayers.length);
      setIsHost(data.host_player_id === playerId);
      setAuthorsCount(data.authors_count ?? 0);

      setForms((prev) => {
        const next = { ...prev };
        for (const p of teammates) {
          if (!next[p.id]) {
            next[p.id] = { category: KUDO_CATEGORIES[0].id, message: "", sending: false, error: null, open: false };
          }
        }
        return next;
      });

      setLoading(false);
    }

    fetchRoom();
    const id = setInterval(fetchRoom, 2000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, upperCode]);

  function toggleForm(recipientId: string) {
    if (sentTo.has(recipientId)) return;
    setForms((prev) => ({
      ...prev,
      [recipientId]: { ...prev[recipientId], open: !prev[recipientId]?.open },
    }));
  }

  function updateForm(recipientId: string, patch: Partial<CardForm>) {
    setForms((prev) => ({
      ...prev,
      [recipientId]: { ...prev[recipientId], ...patch },
    }));
  }

  async function sendCard(recipientId: string) {
    const form = forms[recipientId];
    if (!form || !form.message.trim()) return;

    updateForm(recipientId, { sending: true, error: null });

    try {
      const res = await fetch(`/api/kudo-cards/room/${upperCode}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Player-Secret": playerSecret,
        },
        body: JSON.stringify({
          authorId: playerId,
          recipientId,
          category: form.category,
          message: form.message.trim(),
        }),
      });
      const data = await res.json() as { cardId?: string; error?: string };

      if (!res.ok) {
        updateForm(recipientId, { sending: false, error: data.error ?? "Erreur" });
        return;
      }

      // Mark as sent
      const newSentTo = new Set([...sentTo, recipientId]);
      setSentTo(newSentTo);
      localStorage.setItem(`kudo_sent_${upperCode}_${playerId}`, JSON.stringify([...newSentTo]));
      updateForm(recipientId, { sending: false, open: false });
    } catch {
      updateForm(recipientId, { sending: false, error: "Une erreur est survenue." });
    }
  }

  async function revealCards() {
    setRevealing(true);
    setRevealError(null);
    try {
      const res = await fetch(`/api/kudo-cards/room/${upperCode}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) setRevealError(data.error ?? "Erreur lors de la révélation");
    } catch {
      setRevealError("Une erreur est survenue.");
    } finally {
      setRevealing(false);
    }
  }

  const getCategoryById = (id: string): KudoCategory =>
    KUDO_CATEGORIES.find((c) => c.id === id) ?? KUDO_CATEGORIES[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header guestMode />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  const sentCount = sentTo.size;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header guestMode />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8">

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-2 mb-3">
            <Sparkles size={15} className="text-amber-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Écriture des cartes
            </span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Qui mérite un kudo ?
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vos cartes restent cachées jusqu&apos;à la révélation.
            {players.length > 0 && (
              <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">
                {sentCount}/{players.length} envoyé{sentCount > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {/* Teammate cards */}
        <div className="space-y-2 mb-6">
          {players.map((player) => {
            const isSent = sentTo.has(player.id);
            const form   = forms[player.id];
            const cat    = getCategoryById(form?.category ?? KUDO_CATEGORIES[0].id);

            return (
              <div
                key={player.id}
                className={`bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden transition-all ${
                  isSent
                    ? "border-amber-200 dark:border-amber-800 opacity-70"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              >
                {/* Recipient row */}
                <button
                  onClick={() => toggleForm(player.id)}
                  disabled={isSent}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: player.avatar_color }}
                  />
                  <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {player.pseudo}
                  </span>
                  {isSent ? (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                      <span className="text-base">💛</span> Envoyé
                    </span>
                  ) : (
                    <>
                      <span className="text-xs text-gray-400 mr-1">
                        {form?.open ? "Fermer" : "Écrire"}
                      </span>
                      {form?.open
                        ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" />
                        : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                      }
                    </>
                  )}
                </button>

                {/* Card form */}
                {form?.open && !isSent && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-3 space-y-3">
                    {/* Category picker */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Type de kudo
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {KUDO_CATEGORIES.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => updateForm(player.id, { category: c.id })}
                            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl border text-xs font-medium transition-all ${
                              form.category === c.id
                                ? "ring-2 ring-offset-1 ring-amber-400 border-transparent scale-105"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-200"
                            }`}
                            style={
                              form.category === c.id
                                ? {
                                    backgroundColor: isDark ? c.bgDark : c.bgLight,
                                    borderColor:     isDark ? c.borderDark : c.borderLight,
                                    color:           isDark ? '#e2e8f0' : c.colorHex,
                                  }
                                : {}
                            }
                          >
                            <span className="text-lg">{c.emoji}</span>
                            <span className="leading-tight text-center">{c.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                        Votre message
                      </p>
                      <textarea
                        value={form.message}
                        onChange={(e) => updateForm(player.id, { message: e.target.value })}
                        placeholder={`Merci ${player.pseudo} pour…`}
                        maxLength={240}
                        rows={3}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                      />
                      <p className="text-right text-xs text-gray-400 mt-0.5">
                        {form.message.length}/240
                      </p>
                    </div>

                    {form.error && (
                      <p className="text-xs text-red-500">{form.error}</p>
                    )}

                    <button
                      onClick={() => sendCard(player.id)}
                      disabled={!form.message.trim() || form.sending}
                      className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
                      style={{ backgroundColor: cat.colorHex }}
                    >
                      {form.sending
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Send size={14} />
                      }
                      {form.sending ? "Envoi…" : `Envoyer à ${player.pseudo}`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Host reveal panel */}
        {isHost && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                Animateur — révélation
              </p>
              <span className="text-xs text-gray-400">
                {authorsCount}/{totalPlayers} ont écrit
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Révélez les cartes quand vous êtes prêt. Tous les participants seront redirigés vers le mur de kudos.
            </p>
            {revealError && (
              <p className="text-xs text-red-500 mb-2">{revealError}</p>
            )}
            <button
              onClick={revealCards}
              disabled={revealing}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {revealing
                ? <Loader2 size={15} className="animate-spin" />
                : <Eye size={15} />
              }
              {revealing ? "Révélation…" : "Révéler les cartes"}
            </button>
          </div>
        )}

        {!isHost && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5">
            <Loader2 size={12} className="animate-spin" />
            En attente de la révélation par l&apos;animateur…
          </p>
        )}
      </main>
    </div>
  );
}
