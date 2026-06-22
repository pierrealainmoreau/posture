"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { AVATAR_COLORS } from "@/lib/estimation-express/types";

export default function EstimationExpressJoinPage() {
  const router = useRouter();

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/estimation-express", label: "Estimation Express" },
    { label: "Rejoindre" },
  ];

  const [code, setCode]               = useState("");
  const [pseudo, setPseudo]           = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[5]);
  const [joining, setJoining]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("first_name").eq("id", user.id).single();
      if (data?.first_name) setPseudo(data.first_name);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const upperCode = code.trim().toUpperCase();
    if (!upperCode || !pseudo.trim()) return;

    setJoining(true);
    setError(null);

    try {
      const res = await fetch(`/api/estimation-express/room/${upperCode}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: pseudo.trim(), avatarColor }),
      });
      const data = await res.json() as { playerId?: string; playerSecret?: string; error?: string };

      if (!res.ok || !data.playerId) {
        setError(data.error ?? "Code invalide ou session déjà démarrée");
        setJoining(false);
        return;
      }

      localStorage.setItem(
        `estimationexpress_player_${upperCode}`,
        JSON.stringify({ playerId: data.playerId, playerSecret: data.playerSecret, pseudo: pseudo.trim(), avatarColor })
      );

      router.push(`/toolbox/estimation-express/${upperCode}/lobby`);
    } catch {
      setError("Une erreur est survenue.");
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />
      <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Rejoindre une session</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Code de session</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ex. AB12CD"
              maxLength={6}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-base font-mono tracking-widest text-center uppercase bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Pseudo</label>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Votre prénom"
              maxLength={24}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Couleur avatar</label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${avatarColor === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!code.trim() || !pseudo.trim() || joining}
            className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {joining ? <><Loader2 size={16} className="animate-spin" /> Connexion…</> : "Rejoindre"}
          </button>
        </form>
      </main>
    </div>
  );
}
