"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2, Download, Link2, Check, ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { LinkParticipantsModal } from "@/components/LinkParticipantsModal";
import { createClient } from "@/lib/supabase/client";
import { KUDO_CATEGORIES, type KudoRoomResponse, type KudoCardFull, type KudoPlayer } from "@/lib/kudo-cards/types";
import { ContinueSessionButton } from "@/components/ContinueSessionButton";

function getCategory(id: string) {
  return KUDO_CATEGORIES.find((c) => c.id === id) ?? KUDO_CATEGORIES[0];
}

function KudoCard({ card, index }: { card: KudoCardFull; index: number }) {
  const cat = getCategory(card.category);

  return (
    <div
      className="kudo-card flex flex-col rounded-2xl overflow-hidden shadow-sm border"
      style={{
        backgroundColor: cat.bgLight,
        borderColor: cat.borderLight,
        animation: `kudoAppear 0.5s ease both`,
        animationDelay: `${index * 80}ms`,
        opacity: 0,
      }}
    >
      <div
        className="px-4 pt-4 pb-2 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${cat.borderLight}` }}
      >
        <span className="text-xs font-semibold" style={{ color: cat.colorHex }}>
          {cat.label}
        </span>
        <span className="text-2xl">{cat.emoji}</span>
      </div>

      <div className="flex-1 px-4 py-3">
        <p className="text-sm leading-relaxed line-clamp-5" style={{ color: "#374151" }}>
          &ldquo;{card.message}&rdquo;
        </p>
      </div>

      <div
        className="px-4 py-2.5 flex items-center gap-1.5"
        style={{ borderTop: `1px solid ${cat.borderLight}` }}
      >
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: card.author.avatar_color }} />
        <span className="text-xs truncate" style={{ color: "#6b7280" }}>{card.author.pseudo}</span>
        <span className="text-xs mx-0.5" style={{ color: "#9ca3af" }}>→</span>
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: card.recipient.avatar_color }} />
        <span className="text-xs font-medium truncate" style={{ color: "#111827" }}>{card.recipient.pseudo}</span>
      </div>
    </div>
  );
}

const breadcrumbs = [
  { href: "/", label: "Accueil" },
  { href: "/reunion-maker", label: "Réunion Maker" },
  { href: "/reunion-maker/kudo-cards", label: "Kudo Cards" },
  { label: "Mur de kudos" },
];

export default function KudoWallPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();

  const [cards, setCards]           = useState<KudoCardFull[]>([]);
  const [players, setPlayers]       = useState<KudoPlayer[]>([]);
  const [isCreator, setIsCreator]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [exporting, setExporting]   = useState(false);
  const [copied, setCopied]         = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const exportRef  = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchWall() {
      const [res, userRes] = await Promise.all([
        fetch(`/api/kudo-cards/room/${upperCode}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store" },
        }),
        createClient().auth.getUser(),
      ]);
      if (!res.ok) { setError("Session introuvable ou non révélée."); setLoading(false); return; }
      const data = await res.json() as KudoRoomResponse;
      if (data.status !== "revealed") { setError("Les cartes ne sont pas encore révélées."); setLoading(false); return; }
      setCards(data.cards ?? []);
      setPlayers(data.players ?? []);
      setIsCreator(!!userRes.data.user && userRes.data.user.id === data.creator_user_id);
      setLoading(false);
    }

    fetchWall();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  async function exportPng() {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    try {
      const cardEls = exportRef.current.querySelectorAll<HTMLElement>('.kudo-card');
      cardEls.forEach((el) => { el.style.animation = 'none'; el.style.opacity = '1'; el.style.transform = 'none'; });

      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#fffbeb', scale: 2, useCORS: true, logging: false,
      });

      cardEls.forEach((el) => { el.style.animation = ''; el.style.opacity = ''; el.style.transform = ''; });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `kudos-${upperCode}.png`;
        a.click(); URL.revokeObjectURL(url);
      }, 'image/png');
    } catch { /* silent */ } finally { setExporting(false); }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Find the most-cited recipient for the "what's next" hint
  const topRecipient = cards.length > 0
    ? Object.entries(
        cards.reduce((acc, c) => { acc[c.recipient.pseudo] = (acc[c.recipient.pseudo] ?? 0) + 1; return acc; }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement du mur…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <p className="text-sm text-gray-500">{error}</p>
          <Link href="/reunion-maker/kudo-cards" className="text-sm text-amber-600 hover:underline">
            ← Retour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-gray-50 dark:from-amber-950/20 dark:to-gray-950 flex flex-col">
      <style>{`
        @keyframes kudoAppear {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <Header breadcrumbs={breadcrumbs} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">

        {/* Summary + CTAs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🎉</span>
              <span className="text-base font-semibold text-amber-700 dark:text-amber-300">
                {cards.length} kudo{cards.length > 1 ? "s" : ""} révélé{cards.length > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chaque carte est un signe de reconnaissance de l&apos;équipe.
            </p>
          </div>

          {cards.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {/* Lier à Mon Équipe — host only */}
              {isCreator && (
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium rounded-xl hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
                >
                  <Users size={14} />
                  Lier à Mon Équipe
                </button>
              )}

              {/* Copy link */}
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Link2 size={14} />}
                {copied ? "Copié !" : "Copier le lien"}
              </button>

              {/* Export PNG */}
              <button
                onClick={exportPng}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {exporting ? "Export…" : "Enregistrer en PNG"}
              </button>
            </div>
          )}
        </div>

        {/* Cards grid or empty state */}
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">💭</span>
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Aucune carte envoyée
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
              Personne n&apos;a écrit de carte lors de cette session. Vous pouvez relancer la phase d&apos;écriture.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href={`/reunion-maker/kudo-cards/${upperCode}/lobby`}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Retourner à la session
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/reunion-maker/kudo-cards"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                ← Toutes les sessions
              </Link>
            </div>
          </div>
        ) : (
          <div ref={exportRef} className="rounded-2xl p-6 bg-amber-50/80 dark:bg-amber-950/10">
            <p className="text-center text-sm font-semibold text-amber-800 dark:text-amber-300 mb-5 tracking-wide">
              Kudo Cards · Session {upperCode}
            </p>
            <div
              className="kudo-grid grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
            >
              {cards.map((card, i) => (
                <KudoCard key={card.id} card={card} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Category legend */}
        {cards.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              Légende
            </p>
            <div className="flex flex-wrap gap-2">
              {KUDO_CATEGORIES.map((cat) => {
                const count = cards.filter((c) => c.category === cat.id).length;
                if (count === 0) return null;
                return (
                  <span
                    key={cat.id}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
                    style={{ backgroundColor: cat.bgLight, borderColor: cat.borderLight, color: cat.colorHex }}
                  >
                    {cat.emoji} {cat.label}
                    <span className="font-bold">{count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* What's next */}
        {cards.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-5 py-4">
            <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1.5">
              Et maintenant ?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Prenez 2 minutes pour remercier oralement
              {topRecipient ? (
                <span className="font-medium text-gray-700 dark:text-gray-300"> {topRecipient}</span>
              ) : " la personne la plus citée"}
              , puis partagez ce mur à votre équipe via le bouton &laquo;&nbsp;Copier le lien&nbsp;&raquo;
              pour qu&apos;elle puisse le retrouver plus tard.
            </p>
          </div>
        )}
        <ContinueSessionButton gameType="kudo_cards" roomCode={upperCode} />
      </main>

      {/* Modal lier participants */}
      {showLinkModal && (
        <LinkParticipantsModal
          sessionType="kudo_cards"
          roomCode={upperCode}
          participants={players.map((p) => ({ pseudo: p.pseudo, avatar_color: p.avatar_color }))}
          onClose={() => setShowLinkModal(false)}
        />
      )}
    </div>
  );
}
