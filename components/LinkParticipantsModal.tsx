"use client";

import { useEffect, useState } from "react";
import { X, Users, Check, Loader2, Link2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Collaborator } from "@/lib/types";
import { COACH_SENIORITY_LABELS } from "@/lib/types";

interface Props {
  sessionType: "retrospective" | "kudo_cards" | "abcde";
  roomCode: string;
  participants: Array<{ pseudo: string; avatar_color: string }>;
  onClose: () => void;
}

export function LinkParticipantsModal({ sessionType, roomCode, participants, onClose }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [mapping, setMapping]             = useState<Record<string, string>>({}); // pseudo → collaborator_id
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [saved, setSaved]                 = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger la liste des collaborateurs
      const { data: collabs } = await supabase
        .from("collaborators")
        .select("*")
        .eq("user_id", user.id)
        .order("first_name");
      setCollaborators((collabs as Collaborator[]) ?? []);

      // Charger les liens existants pour cette room
      const res = await fetch(
        `/api/session-links?session_type=${sessionType}&room_code=${roomCode}`
      );
      if (res.ok) {
        const existing = await res.json() as Array<{ player_pseudo: string; collaborator_id: string }>;
        const init: Record<string, string> = {};
        existing.forEach(({ player_pseudo, collaborator_id }) => {
          init[player_pseudo] = collaborator_id;
        });
        setMapping(init);
      }
      setLoading(false);
    }
    load();
  }, [sessionType, roomCode]);

  async function save() {
    const links = Object.entries(mapping)
      .filter(([, collabId]) => !!collabId)
      .map(([player_pseudo, collaborator_id]) => ({ player_pseudo, collaborator_id }));

    setSaving(true);
    await fetch("/api/session-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_type: sessionType, room_code: roomCode, links }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  }

  function initials(c: Collaborator) {
    return ((c.first_name[0] ?? "") + (c.last_name[0] ?? "")).toUpperCase();
  }

  const linkedCount = Object.values(mapping).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center">
              <Link2 size={14} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Lier à Mon Équipe</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {linkedCount}/{participants.length} participants liés
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 size={18} className="animate-spin mr-2" /> Chargement…
            </div>
          ) : collaborators.length === 0 ? (
            <div className="text-center py-8">
              <Users size={28} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Aucun membre dans votre équipe</p>
              <a href="/coach" className="text-xs text-green-600 dark:text-green-400 underline">
                Ajouter des membres →
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map(({ pseudo, avatar_color }) => (
                <div key={pseudo} className="flex items-center gap-3">
                  {/* Participant */}
                  <div className="flex items-center gap-2 w-32 flex-shrink-0">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: avatar_color }}>
                      {pseudo[0].toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate font-medium">{pseudo}</span>
                  </div>

                  <span className="text-gray-300 dark:text-gray-600 text-xs">→</span>

                  {/* Selector */}
                  <select
                    value={mapping[pseudo] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [pseudo]: e.target.value }))}
                    className="flex-1 px-3 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">— non lié —</option>
                    {collaborators.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} · {COACH_SENIORITY_LABELS[c.seniority]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <button onClick={save}
            disabled={saving || saved || collaborators.length === 0 || linkedCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Link2 size={14} />}
            {saving ? "Enregistrement…" : saved ? "Enregistré !" : `Lier ${linkedCount > 0 ? linkedCount : ""} participant${linkedCount > 1 ? "s" : ""}`}
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
