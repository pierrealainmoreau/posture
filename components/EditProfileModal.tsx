"use client";

import { useRef, useState } from "react";
import {
  X, Camera, Loader2, Check, ExternalLink,
  Heart, MessageCircle, Target, UserPlus, Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NEED_TYPES = [
  {
    id: "cohesion",
    label: "Cohésion d'équipe",
    desc: "Mini-jeux, rétrospectives, kudo cards",
    Icon: Users,
    iconBg: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-700 dark:text-blue-400",
    selectedRing: "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/40",
  },
  {
    id: "performance",
    label: "Performance collective",
    desc: "Feedback, OKR, quiz managérial",
    Icon: Target,
    iconBg: "bg-violet-50 dark:bg-violet-950",
    iconColor: "text-violet-700 dark:text-violet-400",
    selectedRing: "border-violet-500 dark:border-violet-400 bg-violet-50/50 dark:bg-violet-950/40",
  },
  {
    id: "wellbeing",
    label: "Bien-être au travail",
    desc: "Humeur, icebreakers, kudo cards",
    Icon: Heart,
    iconBg: "bg-emerald-50 dark:bg-emerald-950",
    iconColor: "text-emerald-700 dark:text-emerald-400",
    selectedRing: "border-emerald-500 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40",
  },
  {
    id: "communication",
    label: "Communication d'équipe",
    desc: "ABCDE, réunion, icebreakers",
    Icon: MessageCircle,
    iconBg: "bg-amber-50 dark:bg-amber-950",
    iconColor: "text-amber-700 dark:text-amber-400",
    selectedRing: "border-amber-500 dark:border-amber-400 bg-amber-50/50 dark:bg-amber-950/40",
  },
  {
    id: "onboarding",
    label: "Intégrer un collaborateur",
    desc: "1:1 Coach, icebreakers, rétrospective",
    Icon: UserPlus,
    iconBg: "bg-cyan-50 dark:bg-cyan-950",
    iconColor: "text-cyan-700 dark:text-cyan-400",
    selectedRing: "border-cyan-500 dark:border-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/40",
  },
] as const;

export interface ProfileEditData {
  avatar_url: string | null;
  linkedin_url: string | null;
  coach_interest: string | null;
  newsletter_opt_in: boolean;
}

interface Props {
  userId: string;
  firstName: string;
  initialData: ProfileEditData;
  onClose: () => void;
  onSaved: (data: ProfileEditData) => void;
}

export function EditProfileModal({ userId, firstName, initialData, onClose, onSaved }: Props) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData.avatar_url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [linkedin, setLinkedin] = useState(initialData.linkedin_url ?? "");
  const [coachInterest, setCoachInterest] = useState<string | null>(initialData.coach_interest);
  const [newsletterOptIn, setNewsletterOptIn] = useState(initialData.newsletter_opt_in);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      let finalAvatarUrl = initialData.avatar_url;

      if (avatarFile) {
        const supabase = createClient();
        const ext = avatarFile.name.split(".").pop() ?? "jpg";
        const path = `${userId}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });

        if (uploadError) {
          setSaveError(`Erreur upload photo : ${uploadError.message}`);
          return;
        }

        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        finalAvatarUrl = data.publicUrl + `?t=${Date.now()}`;
      }

      const cleanLinkedin = linkedin.trim() || null;

      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar_url: finalAvatarUrl,
          linkedin_url: cleanLinkedin,
          coach_interest: coachInterest,
          newsletter_opt_in: newsletterOptIn,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSaveError(body.error ?? `Erreur serveur (${res.status})`);
        return;
      }

      onSaved({
        avatar_url: finalAvatarUrl,
        linkedin_url: cleanLinkedin,
        coach_interest: coachInterest,
        newsletter_opt_in: newsletterOptIn,
      });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Mon profil</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-7">

          {/* ── Avatar ── */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative group"
              aria-label="Changer la photo de profil"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-2xl font-bold select-none">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-md group-hover:bg-blue-700 transition-colors">
                <Camera size={12} className="text-white" />
              </div>
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500">Cliquez pour modifier</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* ── Newsletter ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Newsletters
            </p>
            <button
              onClick={() => setNewsletterOptIn((v) => !v)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                newsletterOptIn
                  ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              }`}
            >
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {newsletterOptIn ? "Inscrit aux newsletters" : "Désinscrit des newsletters"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {newsletterOptIn
                    ? "Vous recevez nos conseils managériaux par email"
                    : "Vous ne recevez plus nos emails"}
                </p>
              </div>
              <div className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                newsletterOptIn ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
              }`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  newsletterOptIn ? "translate-x-5" : "translate-x-1"
                }`} />
              </div>
            </button>
          </div>

          {/* ── LinkedIn ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              LinkedIn
            </p>
            <div className="relative">
              <ExternalLink
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
              />
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/votre-profil"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* ── Coach interest ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Ce qui m&apos;intéresse le plus
            </p>
            <div className="flex flex-col gap-2">
              {NEED_TYPES.map((need) => {
                const { Icon } = need;
                const isSelected = coachInterest === need.id;
                return (
                  <button
                    key={need.id}
                    onClick={() => setCoachInterest(isSelected ? null : need.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `border-2 ${need.selectedRing}`
                        : "border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${need.iconBg}`}>
                      <Icon size={15} className={need.iconColor} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 dark:text-white leading-tight">{need.label}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">{need.desc}</p>
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-3">
          {saveError && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {saveError}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
