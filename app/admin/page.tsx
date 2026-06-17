"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  MessageCircle,
  Trash2,
  BarChart2,
  TrendingUp,
  MousePointerClick,
  Activity,
  Loader2,
  RefreshCw,
  Lightbulb,
  Bug,
  Sparkles,
  Scale,
  BookOpen,
  MessageSquare,
  Gamepad2,
  PenLine,
  Crown,
  Check,
  X,
  MailCheck,
  Link2,
  Telescope,
  Plus,
  GripVertical,
  ThumbsUp,
  Bell,
  Send,
  Info,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutDashboard,
  Mail,
  Type,
  SquareMousePointer,
  ImageIcon,
  ArrowUp,
  ArrowDown,
  Upload,
  History,
  ChevronDown,
  User,
  Eye,
  Italic,
  UserPlus,
} from "lucide-react";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "user" | "premium" | "admin";
  usage_limit: number;
  created_at: string;
  email_confirmed_at: string | null;
  usage: { feedback: number; interview: number; recruitment: number };
  totalUsage: number;
  collaborators: number;
  mini_games: { draw: number; tvml: number; anecdotes: number; icebreaker: number; chaine: number };
  totalMiniGames: number;
  sessions: number;
}

type SuggestionStatus = "pending" | "planned" | "done" | "rejected";

interface SuggestionRow {
  id: string;
  category: string;
  message: string;
  created_at: string;
  status: SuggestionStatus;
  email_sent_at: string | null;
  rejection_reason: string | null;
  profiles: { first_name: string; last_name: string; email: string } | null;
}

interface PMFRow {
  id: string;
  answer: "very_disappointed" | "somewhat_disappointed" | "not_disappointed";
  created_at: string;
  profiles: { first_name: string; last_name: string; email: string } | null;
}

type PremiumRequestStatus = "pending" | "approved" | "rejected";

interface PremiumRequestRow {
  id: string;
  status: PremiumRequestStatus;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles: { first_name: string; last_name: string; email: string } | null;
}

type RoadmapPhase = "now" | "next" | "later" | "released";

interface RoadmapAdminItem {
  id: string;
  phase: RoadmapPhase;
  title: string;
  description: string;
  tag: string | null;
  sort_order: number;
  likes_count?: number;
}

type Tab = "overview" | "users" | "suggestions" | "pmf" | "minijeux" | "premium" | "roadmap" | "notifications" | "email" | "referrals";

type EmailBlock =
  | { id: string; type: "text";    content: string; bold: boolean; italic: boolean }
  | { id: string; type: "callout"; content: string }
  | { id: string; type: "cta";     label: string;   url: string   }
  | { id: string; type: "image";   src: string;     alt: string   };

function newBlock(type: EmailBlock["type"]): EmailBlock {
  const id = Math.random().toString(36).slice(2, 9);
  if (type === "text")    return { id, type: "text",    content: "", bold: false, italic: false };
  if (type === "callout") return { id, type: "callout", content: "" };
  if (type === "cta")     return { id, type: "cta",     label: "En savoir plus", url: "https://posture.pamoreau.xyz" };
  return { id, type: "image", src: "", alt: "" };
}

function EmailBlockPreview({ block }: { block: EmailBlock }) {
  if (block.type === "text") return (
    <p className={`text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed whitespace-pre-wrap ${block.bold ? "font-bold" : ""} ${block.italic ? "italic" : ""}`}>
      {block.content || <span className="text-gray-300 dark:text-gray-600 italic">Texte vide…</span>}
    </p>
  );
  if (block.type === "callout") return (
    <div className="bg-blue-50 dark:bg-blue-950/40 border-l-3 border-blue-700 dark:border-blue-500 rounded-md px-3 py-2.5 mb-3" style={{ borderLeftWidth: "3px" }}>
      <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed whitespace-pre-wrap">
        {block.content || <span className="text-blue-300 dark:text-blue-700 italic">Texte vide…</span>}
      </p>
    </div>
  );
  if (block.type === "cta") return (
    <div className="mb-4">
      <span className="inline-block bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg">
        {block.label || "Bouton CTA"}
      </span>
    </div>
  );
  if (block.type === "image") return (
    <div className="mb-4">
      {block.src
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={block.src} alt={block.alt} className="max-w-full rounded-lg object-cover" style={{ maxHeight: "120px" }} />
        : <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-400 gap-1.5"><ImageIcon size={14} /> URL image vide</div>
      }
    </div>
  );
  return null;
}

interface ActivityEvent {
  type: "tool" | "minijeu" | "page";
  label: string;
  created_at: string;
  meta?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function UsageBar({ count, limit }: { count: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (count / limit) * 100) : 100;
  const color = pct >= 100 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums w-10 text-right">
        {count}/{limit}
      </span>
    </div>
  );
}


const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  idea:        { label: "Idée",         icon: <Lightbulb size={13} />,     cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  improvement: { label: "Amélioration", icon: <Sparkles size={13} />,      cls: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"       },
  bug:         { label: "Bug",          icon: <Bug size={13} />,            cls: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"             },
  other:       { label: "Autre",        icon: <MessageSquare size={13} />,  cls: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"         },
};

function CategoryBadge({ category }: { category: string }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.other;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.cls}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

// ─── Roadmap form ─────────────────────────────────────────────────────────────

interface RoadmapFormState { title: string; description: string; tag: string }

function RoadmapItemForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
}: {
  form: RoadmapFormState;
  setForm: React.Dispatch<React.SetStateAction<RoadmapFormState>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-3 mt-3 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
      <input
        autoFocus
        type="text"
        placeholder="Titre *"
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        rows={6}
        placeholder="Description"
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <input
        type="text"
        placeholder="Tag (ex: Nouvelle fonctionnalité)"
        value={form.tag}
        onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={saving || !form.title.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Enregistrer
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const VALID_TABS: Tab[] = ["overview", "users", "suggestions", "pmf", "minijeux", "premium", "roadmap", "notifications", "email", "referrals"];

const TRIGGER_EVENT_GROUPS: { label: string; options: { value: string; label: string }[] }[] = [
  {
    label: "Cycle de vie utilisateur",
    options: [
      { value: "user_signup", label: "Inscription d'un nouvel utilisateur" },
      { value: "first_login", label: "Première connexion" },
      { value: "user_inactive_7d", label: "Inactif depuis 7 jours" },
      { value: "user_inactive_30d", label: "Inactif depuis 30 jours" },
    ],
  },
  {
    label: "Premium",
    options: [
      { value: "upgrade_premium", label: "Passage en Premium" },
      { value: "trial_ending", label: "Fin d'essai imminente" },
      { value: "downgrade_premium", label: "Rétrogradation depuis Premium" },
    ],
  },
  {
    label: "Activité produit",
    options: [
      { value: "minigame_completed", label: "Mini-jeu terminé" },
      { value: "retro_completed", label: "Rétrospective complétée" },
      { value: "kudo_received", label: "Kudo card reçue" },
      { value: "roadmap_item_shipped", label: "Item roadmap livré" },
      { value: "suggestion_answered", label: "Suggestion répondue par l'équipe" },
    ],
  },
  {
    label: "Plateforme",
    options: [
      { value: "new_feature_release", label: "Nouvelle fonctionnalité disponible" },
      { value: "signup_anniversary", label: "Anniversaire d'inscription" },
    ],
  },
];
function AdminPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(
    initialTab && VALID_TABS.includes(initialTab) ? initialTab : "overview"
  );
  const [collapsed, setCollapsed] = useState(false);

  // Users
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Suggestions
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [suggActionId, setSuggActionId] = useState<string | null>(null);
  const [suggFilter, setSuggFilter]       = useState<SuggestionStatus | "all">("all");
  const [rejectingId, setRejectingId]     = useState<string | null>(null);
  const [rejectReason, setRejectReason]   = useState("");

  // Analytics
  interface AnalyticsData {
    views7d: number; views30d: number;
    wau: number; mau: number;
    sessions7d: number; sessions30d: number;
    bounceRate: number;
    topPages: { path: string; views: number }[];
    dailyViews: { date: string; views: number }[];
    activeUsers: { id: string; first_name: string; last_name: string; email: string; views: number }[];
  }
  const [analytics, setAnalytics]         = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError]     = useState<string | null>(null);

  // Mini-jeux analytics
  interface MinijeuxData {
    dailySessions: { date: string; count: number }[];
    games: { key: string; label: string; color: string; total: number; last7d: number }[];
  }
  const [minijeuxData, setMinijeuxData]           = useState<MinijeuxData | null>(null);
  const [minijeuxLoading, setMinijeuxLoading]     = useState(false);
  const [minijeuxError, setMinijeuxError]         = useState<string | null>(null);

  // PMF
  const [pmf, setPmf]             = useState<PMFRow[]>([]);
  const [pmfLoading, setPmfLoading] = useState(false);
  const [pmfError, setPmfError]   = useState<string | null>(null);

  // Referrals
  interface ReferralAdminRow {
    id: string; first_name: string; last_name: string; email: string;
    referral_code: string | null; referral_count: number;
    invited: { first_name: string; created_at: string }[];
  }
  const [referrals, setReferrals]               = useState<ReferralAdminRow[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [referralsError, setReferralsError]     = useState<string | null>(null);

  // Premium requests
  const [premiumRequests, setPremiumRequests]       = useState<PremiumRequestRow[]>([]);
  const [premiumLoading, setPremiumLoading]         = useState(false);
  const [premiumError, setPremiumError]             = useState<string | null>(null);
  const [premiumActionId, setPremiumActionId]       = useState<string | null>(null);

  // Roadmap
  const [roadmapItems, setRoadmapItems]             = useState<RoadmapAdminItem[]>([]);
  const [roadmapLoading, setRoadmapLoading]         = useState(false);
  const [roadmapError, setRoadmapError]             = useState<string | null>(null);
  const [roadmapActionId, setRoadmapActionId]       = useState<string | null>(null);
  const [roadmapEditId, setRoadmapEditId]           = useState<string | null>(null);
  const [roadmapAddPhase, setRoadmapAddPhase]       = useState<RoadmapPhase | null>(null);
  const [roadmapForm, setRoadmapForm]               = useState({ title: "", description: "", tag: "" });
  const [roadmapDragId, setRoadmapDragId]           = useState<string | null>(null);
  const [roadmapDragOverId, setRoadmapDragOverId]   = useState<string | null>(null);
  const [roadmapDragOverPhase, setRoadmapDragOverPhase] = useState<RoadmapPhase | null>(null);

  // Notifications
  interface NotifTemplate {
    id: string; title: string; body: string | null; type: string;
    href: string | null; trigger_event: string | null; is_active: boolean; created_at: string;
  }
  const [notifTemplates, setNotifTemplates]         = useState<NotifTemplate[]>([]);
  const [notifLoading, setNotifLoading]             = useState(false);
  const [notifError, setNotifError]                 = useState<string | null>(null);
  const [notifSending, setNotifSending]             = useState(false);
  const [notifSendSuccess, setNotifSendSuccess]     = useState<string | null>(null);
  const [notifForm, setNotifForm]                   = useState({ title: "", body: "", type: "info", href: "", target: "all" });
  const [notifUserIds, setNotifUserIds]             = useState<string[]>([]);
  const [notifUserSearch, setNotifUserSearch]       = useState("");
  const [showAddTemplate, setShowAddTemplate]       = useState(false);
  const [templateForm, setTemplateForm]             = useState({ title: "", body: "", type: "info", href: "", trigger_event: "" });
  const [templateSaving, setTemplateSaving]         = useState(false);
  const [triggerCustom, setTriggerCustom]           = useState(false);

  // Email broadcast
  const [emailSubject, setEmailSubject]             = useState("");
  const [emailBlocks, setEmailBlocks]               = useState<EmailBlock[]>([newBlock("text")]);
  const [emailTarget, setEmailTarget]               = useState<"all" | "premium" | "specific">("all");
  const [emailUserIds, setEmailUserIds]             = useState<string[]>([]);
  const [emailUserSearch, setEmailUserSearch]       = useState("");
  const [uploadingBlockId, setUploadingBlockId]     = useState<string | null>(null);
  const [emailSending, setEmailSending]             = useState(false);
  const [emailSuccess, setEmailSuccess]             = useState<string | null>(null);
  const [emailError, setEmailError]                 = useState<string | null>(null);

  interface EmailBroadcast {
    id: string; created_at: string; subject: string; blocks: EmailBlock[];
    target: string; target_label: string; sent_count: number;
    opens: number; clicks: number;
  }
  interface EmailBroadcastRecipient {
    id: string; user_id: string | null; email: string; first_name: string | null;
    sent_at: string; opened_at: string | null; open_count: number;
    clicked_at: string | null; click_count: number;
  }
  const [emailHistory, setEmailHistory]             = useState<EmailBroadcast[]>([]);
  const [emailHistoryLoading, setEmailHistoryLoading] = useState(false);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(null);
  const [broadcastDetail, setBroadcastDetail]         = useState<{ broadcast: EmailBroadcast; recipients: EmailBroadcastRecipient[] } | null>(null);
  const [broadcastDetailLoading, setBroadcastDetailLoading] = useState(false);

  function addEmailBlock(type: EmailBlock["type"]) {
    setEmailBlocks((prev) => [...prev, newBlock(type)]);
  }

  function removeEmailBlock(id: string) {
    setEmailBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function updateEmailBlock(id: string, patch: Partial<EmailBlock>) {
    setEmailBlocks((prev) => prev.map((b) => b.id === id ? { ...b, ...patch } as EmailBlock : b));
  }

  function moveEmailBlock(id: string, dir: "up" | "down") {
    setEmailBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }

  async function sendBroadcastEmail() {
    if (!emailSubject.trim() || emailBlocks.length === 0) return;
    if (emailTarget === "specific" && emailUserIds.length === 0) {
      setEmailError("Sélectionnez au moins un destinataire.");
      return;
    }
    setEmailSending(true);
    setEmailSuccess(null);
    setEmailError(null);
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: emailSubject.trim(),
          blocks: emailBlocks,
          target: emailTarget,
          userIds: emailTarget === "specific" ? emailUserIds : undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      setEmailSuccess(`Email envoyé à ${d.sent} destinataire(s)`);
      setEmailSubject("");
      setEmailBlocks([newBlock("text")]);
      setEmailUserIds([]);
      setEmailTarget("all");
      fetchEmailHistory();
    } catch (e: unknown) {
      setEmailError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setEmailSending(false);
    }
  }

  async function handleImageUpload(blockId: string, file: File | undefined) {
    if (!file) return;
    setUploadingBlockId(blockId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/email/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur upload");
      updateEmailBlock(blockId, { src: d.url });
    } catch (e: unknown) {
      setEmailError(e instanceof Error ? e.message : "Erreur lors du téléchargement");
    } finally {
      setUploadingBlockId(null);
    }
  }

  async function fetchEmailHistory() {
    setEmailHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/email");
      if (res.ok) setEmailHistory(await res.json());
    } catch { /* ignore */ } finally {
      setEmailHistoryLoading(false);
    }
  }

  async function openBroadcastDetail(id: string) {
    setSelectedBroadcastId(id);
    setBroadcastDetail(null);
    setBroadcastDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/email/${id}`);
      if (res.ok) setBroadcastDetail(await res.json());
    } catch { /* ignore */ } finally {
      setBroadcastDetailLoading(false);
    }
  }

  function closeBroadcastDetail() {
    setSelectedBroadcastId(null);
    setBroadcastDetail(null);
  }

  async function fetchNotifTemplates() {
    setNotifLoading(true);
    setNotifError(null);
    try {
      const res = await fetch("/api/admin/notifications/templates");
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
      const d = await res.json();
      setNotifTemplates(d.templates ?? []);
    } catch (e: unknown) {
      setNotifError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setNotifLoading(false);
    }
  }

  async function sendOneShot() {
    if (!notifForm.title.trim()) return;
    if (notifForm.target === "specific" && notifUserIds.length === 0) {
      setNotifError("Sélectionnez au moins un destinataire.");
      return;
    }
    setNotifSending(true);
    setNotifSendSuccess(null);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: notifForm.title.trim(),
          body: notifForm.body.trim() || null,
          type: notifForm.type,
          href: notifForm.href.trim() || null,
          target: notifForm.target,
          userIds: notifForm.target === "specific" ? notifUserIds : undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      setNotifSendSuccess(`Envoyé à ${d.sent} utilisateur(s)`);
      setNotifForm({ title: "", body: "", type: "info", href: "", target: "all" });
      setNotifUserIds([]);
      setNotifUserSearch("");
    } catch (e: unknown) {
      setNotifError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setNotifSending(false);
    }
  }

  async function saveTemplate() {
    if (!templateForm.title.trim()) return;
    setTemplateSaving(true);
    try {
      const res = await fetch("/api/admin/notifications/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: templateForm.title.trim(),
          body: templateForm.body.trim() || null,
          type: templateForm.type,
          href: templateForm.href.trim() || null,
          trigger_event: templateForm.trigger_event.trim() || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      setNotifTemplates((prev) => [d.template, ...prev]);
      setTemplateForm({ title: "", body: "", type: "info", href: "", trigger_event: "" });
      setTriggerCustom(false);
      setShowAddTemplate(false);
    } catch (e: unknown) {
      setNotifError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setTemplateSaving(false);
    }
  }

  async function toggleTemplate(id: string, is_active: boolean) {
    const res = await fetch(`/api/admin/notifications/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active }),
    });
    if (res.ok) setNotifTemplates((prev) => prev.map((t) => t.id === id ? { ...t, is_active } : t));
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Supprimer ce template ?")) return;
    const res = await fetch(`/api/admin/notifications/templates/${id}`, { method: "DELETE" });
    if (res.ok) setNotifTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  // User activity panel
  const [selectedUserId, setSelectedUserId]         = useState<string | null>(searchParams.get("user"));
  const [activityEvents, setActivityEvents]         = useState<ActivityEvent[]>([]);
  const [activityLoading, setActivityLoading]       = useState(false);
  const activityLoadedForRef                        = useRef<string | null>(null);
  const selectedUser                                = users.find(u => u.id === selectedUserId) ?? null;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!profile || profile.role !== "admin") { router.replace("/"); return; }
      fetchUsers();
      fetchSuggestions();
      fetchPmf();
      fetchPremiumRequests();
      fetchMinijeux();
      fetchRoadmap();
      fetchAnalytics();
    });
  }, [router]);

  async function fetchUsers() {
    setUsersLoading(true);
    setUsersError(null);
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setUsersError(d.error ?? `Erreur ${res.status}`);
      setUsersLoading(false);
      return;
    }
    const loaded: UserRow[] = await res.json();
    setUsers(loaded);
    setUsersLoading(false);
    // Auto-open panel if URL already contains ?user=xxx
    const urlUserId = new URLSearchParams(window.location.search).get("user");
    if (urlUserId && activityLoadedForRef.current !== urlUserId) {
      setSelectedUserId(urlUserId);
      activityLoadedForRef.current = urlUserId;
      setActivityEvents([]);
      setActivityLoading(true);
      fetch(`/api/admin/users/${urlUserId}`)
        .then(r => r.ok ? r.json() : { events: [] })
        .then((data: { events: ActivityEvent[] }) => setActivityEvents(data.events ?? []))
        .finally(() => setActivityLoading(false));
    }
  }

  async function fetchReferrals() {
    setReferralsLoading(true);
    setReferralsError(null);
    try {
      const res = await fetch("/api/admin/referrals");
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
      setReferrals(await res.json());
    } catch (e: unknown) {
      setReferralsError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setReferralsLoading(false);
    }
  }

  async function fetchRoadmap() {
    setRoadmapLoading(true);
    setRoadmapError(null);
    const res = await fetch("/api/roadmap");
    if (!res.ok) { setRoadmapError("Erreur lors du chargement."); setRoadmapLoading(false); return; }
    setRoadmapItems(await res.json());
    setRoadmapLoading(false);
  }

  async function createRoadmapItem(phase: RoadmapPhase) {
    if (!roadmapForm.title.trim()) return;
    setRoadmapActionId("new");
    const maxOrder = Math.max(0, ...roadmapItems.filter(i => i.phase === phase).map(i => i.sort_order));
    const res = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase, title: roadmapForm.title.trim(), description: roadmapForm.description, tag: roadmapForm.tag || null, sort_order: maxOrder + 1 }),
    });
    if (res.ok) {
      const item = await res.json() as RoadmapAdminItem;
      setRoadmapItems(prev => [...prev, item]);
      setRoadmapAddPhase(null);
      setRoadmapForm({ title: "", description: "", tag: "" });
    } else {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setRoadmapError(d.error ?? "Erreur");
    }
    setRoadmapActionId(null);
  }

  async function updateRoadmapItem(id: string) {
    if (!roadmapForm.title.trim()) return;
    setRoadmapActionId(id);
    const res = await fetch("/api/roadmap", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title: roadmapForm.title.trim(), description: roadmapForm.description, tag: roadmapForm.tag || null }),
    });
    if (res.ok) {
      const updated = await res.json() as RoadmapAdminItem;
      setRoadmapItems(prev => prev.map(i => i.id === id ? updated : i));
      setRoadmapEditId(null);
      setRoadmapForm({ title: "", description: "", tag: "" });
    } else {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setRoadmapError(d.error ?? "Erreur");
    }
    setRoadmapActionId(null);
  }

  async function deleteRoadmapItem(id: string) {
    if (!confirm("Supprimer cet item ?")) return;
    setRoadmapActionId(id);
    const res = await fetch("/api/roadmap", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setRoadmapItems(prev => prev.filter(i => i.id !== id));
    } else {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setRoadmapError(d.error ?? "Erreur");
    }
    setRoadmapActionId(null);
  }

  function startEditRoadmap(item: RoadmapAdminItem) {
    setRoadmapEditId(item.id);
    setRoadmapAddPhase(null);
    setRoadmapForm({ title: item.title, description: item.description, tag: item.tag ?? "" });
  }

  async function moveRoadmapItem(targetPhase: RoadmapPhase, draggedId: string, targetId: string | null) {
    const dragged = roadmapItems.find(i => i.id === draggedId);
    if (!dragged) return;
    const sourcePhase = dragged.phase;
    if (sourcePhase === targetPhase && draggedId === targetId) return;

    const targetPhaseItems = roadmapItems
      .filter(i => i.phase === targetPhase && i.id !== draggedId)
      .sort((a, b) => a.sort_order - b.sort_order);

    let insertIdx = targetPhaseItems.length;
    if (targetId) {
      const idx = targetPhaseItems.findIndex(i => i.id === targetId);
      if (idx !== -1) insertIdx = idx;
    }

    const reorderedTarget = [...targetPhaseItems];
    reorderedTarget.splice(insertIdx, 0, dragged);
    const updates = reorderedTarget.map((item, idx) => ({ id: item.id, sort_order: idx, phase: targetPhase }));

    if (sourcePhase !== targetPhase) {
      const sourceRemaining = roadmapItems
        .filter(i => i.phase === sourcePhase && i.id !== draggedId)
        .sort((a, b) => a.sort_order - b.sort_order);
      sourceRemaining.forEach((item, idx) => updates.push({ id: item.id, sort_order: idx, phase: sourcePhase }));
    }

    setRoadmapItems(prev => prev.map(i => {
      const u = updates.find(x => x.id === i.id);
      return u ? { ...i, sort_order: u.sort_order, phase: u.phase } : i;
    }));

    await Promise.all(updates.map(u =>
      fetch("/api/roadmap", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: u.id, sort_order: u.sort_order, phase: u.phase }) })
    ));
  }

  async function fetchMinijeux() {
    setMinijeuxLoading(true);
    setMinijeuxError(null);
    const res = await fetch("/api/admin/minijeux");
    if (!res.ok) { setMinijeuxError("Erreur lors du chargement."); setMinijeuxLoading(false); return; }
    setMinijeuxData(await res.json());
    setMinijeuxLoading(false);
  }

  async function fetchSuggestions() {
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    const res = await fetch("/api/suggestions");
    if (!res.ok) { setSuggestionsError("Erreur lors du chargement."); setSuggestionsLoading(false); return; }
    setSuggestions(await res.json());
    setSuggestionsLoading(false);
  }

  async function deleteSuggestion(id: string) {
    if (!confirm("Supprimer cette suggestion ? Cette action est irréversible.")) return;
    setSuggActionId(id);
    const res = await fetch("/api/suggestions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setSuggestionsError(data.error ?? "Erreur lors de la suppression");
    } else {
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    }
    setSuggActionId(null);
  }

  async function rejectSuggestion(id: string) {
    setSuggActionId(id);
    const res = await fetch("/api/suggestions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "rejected", notify: false, rejection_reason: rejectReason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSuggestionsError(data.error ?? "Erreur");
    } else {
      setSuggestions((prev) =>
        prev.map((s) => s.id === id ? { ...s, status: "rejected" as SuggestionStatus, rejection_reason: rejectReason } : s)
      );
      setRejectingId(null);
      setRejectReason("");
    }
    setSuggActionId(null);
  }

  async function updateSuggestion(id: string, status: Exclude<SuggestionStatus, "pending" | "rejected">, notify: boolean) {
    setSuggActionId(id);
    const res = await fetch("/api/suggestions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, notify }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSuggestionsError(data.error ?? "Erreur");
    } else {
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status, email_sent_at: notify ? new Date().toISOString() : s.email_sent_at }
            : s
        )
      );
      if (data.emailError) setSuggestionsError(`Statut mis à jour mais email non envoyé : ${data.emailError}`);
    }
    setSuggActionId(null);
  }

  async function fetchPmf() {
    setPmfLoading(true);
    setPmfError(null);
    const res = await fetch("/api/pmf");
    if (!res.ok) { setPmfError("Erreur lors du chargement."); setPmfLoading(false); return; }
    setPmf(await res.json());
    setPmfLoading(false);
  }

  async function fetchPremiumRequests() {
    setPremiumLoading(true);
    setPremiumError(null);
    const res = await fetch("/api/premium-requests");
    if (!res.ok) { setPremiumError("Erreur lors du chargement."); setPremiumLoading(false); return; }
    setPremiumRequests(await res.json());
    setPremiumLoading(false);
  }

  async function openUserActivity(userId: string) {
    setSelectedUserId(userId);
    setActivityEvents([]);
    setActivityLoading(true);
    activityLoadedForRef.current = userId;
    router.replace(`/admin?tab=users&user=${userId}`, { scroll: false });
    const res = await fetch(`/api/admin/users/${userId}`);
    if (res.ok) {
      const data = await res.json() as { events: ActivityEvent[] };
      setActivityEvents(data.events);
    }
    setActivityLoading(false);
  }

  function closeUserActivity() {
    setSelectedUserId(null);
    activityLoadedForRef.current = null;
    router.replace(`/admin?tab=users`, { scroll: false });
  }

  async function fetchAnalytics() {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    const res = await fetch("/api/admin/analytics", { cache: "no-store" });
    if (!res.ok) { setAnalyticsError("Erreur lors du chargement."); setAnalyticsLoading(false); return; }
    setAnalytics(await res.json());
    setAnalyticsLoading(false);
  }

  async function handlePremiumAction(id: string, action: "approve" | "reject") {
    setPremiumActionId(id);
    setPremiumError(null);
    const res = await fetch("/api/premium-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const data = await res.json().catch(() => ({})) as { error?: string };
    if (!res.ok) {
      setPremiumError(data.error ?? "Erreur");
    } else {
      const newStatus: PremiumRequestStatus = action === "approve" ? "approved" : "rejected";
      setPremiumRequests((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: newStatus } : r)
      );
      // Sync role in users tab if approved
      if (action === "approve") {
        const request = premiumRequests.find((r) => r.id === id);
        if (request) {
          setUsers((prev) =>
            prev.map((u) => u.id === request.user_id ? { ...u, role: "premium" as const } : u)
          );
        }
      }
    }
    setPremiumActionId(null);
  }

  function handleTabChange(t: Tab) {
    setTab(t);
    router.replace(`/admin?tab=${t}`, { scroll: false });
    if (t === "minijeux" && !minijeuxData && !minijeuxLoading) fetchMinijeux();
    if (t === "notifications" && notifTemplates.length === 0 && !notifLoading) fetchNotifTemplates();
    if (t === "email" && emailHistory.length === 0 && !emailHistoryLoading) fetchEmailHistory();
    if (t === "referrals" && referrals.length === 0 && !referralsLoading) fetchReferrals();
  }

  function refreshOverview() { fetchUsers(); fetchAnalytics(); }
  const refreshForTab = { overview: refreshOverview, users: fetchUsers, suggestions: fetchSuggestions, premium: fetchPremiumRequests, minijeux: fetchMinijeux, pmf: fetchPmf, roadmap: fetchRoadmap, notifications: fetchNotifTemplates, email: fetchEmailHistory, referrals: fetchReferrals } satisfies Record<Tab, () => void>;
  const loadingForTab = { overview: usersLoading || analyticsLoading, users: usersLoading, suggestions: suggestionsLoading, premium: premiumLoading, minijeux: minijeuxLoading, pmf: pmfLoading, roadmap: roadmapLoading, notifications: notifLoading, email: emailHistoryLoading, referrals: referralsLoading } satisfies Record<Tab, boolean>;

  async function setRole(user: UserRow, newRole: UserRow["role"]) {
    if (newRole === user.role) return;
    setActionId(user.id);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, role: newRole }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setUsersError(d.error ?? "Erreur");
    } else {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
    }
    setActionId(null);
  }

  async function deleteUser(user: UserRow) {
    if (!confirm(`Supprimer ${user.first_name} ${user.last_name} ? Cette action est irréversible.`)) return;
    setActionId(user.id);
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setUsersError(d.error ?? "Erreur");
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    }
    setActionId(null);
  }

  async function confirmEmail(user: UserRow) {
    setActionId(user.id);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, confirm_email: true }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setUsersError(d.error ?? "Erreur lors de la confirmation");
    } else {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, email_confirmed_at: new Date().toISOString() } : u));
    }
    setActionId(null);
  }

  const totalUsers = users.length;
  const totalRequests = users.reduce((s, u) => s + u.totalUsage, 0);
  const premiumUsers = users.filter((u) => u.role === "premium" || u.role === "admin").length;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">

        {/* ─── Sidebar ──────────────────────────────────────────────────── */}
        <aside className={`flex-shrink-0 bg-slate-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-200 ${collapsed ? "w-16" : "w-60"}`}>
          <div className={`flex items-center border-b border-gray-200 dark:border-gray-800 h-12 px-3 ${collapsed ? "justify-center" : "justify-end"}`}>
            <button
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? "Étendre" : "Réduire"}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>
          <div className={`px-2 py-2 border-b border-gray-200 dark:border-gray-800 ${collapsed ? "flex justify-center" : ""}`}>
            <Link
              href="/"
              title="Retour à l'accueil"
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors ${collapsed ? "justify-center" : ""}`}
            >
              <Home size={16} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">Retour à l&apos;accueil</span>}
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {(
              [
                {
                  label: null,
                  items: [
                    { id: "overview" as Tab, label: "Vue d'ensemble", icon: <LayoutDashboard size={16} />, badge: null as string | null, badgeCls: "" },
                  ],
                },
                {
                  label: "Utilisateurs",
                  items: [
                    { id: "users"     as Tab, label: "Liste des utilisateurs", icon: <Users size={16} />,   badge: totalUsers > 0 ? String(totalUsers) : null, badgeCls: "bg-gray-400 dark:bg-gray-600" },
                    { id: "premium"   as Tab, label: "Requête Premium",        icon: <Crown size={16} />,   badge: premiumRequests.filter(r => r.status === "pending").length > 0 ? String(premiumRequests.filter(r => r.status === "pending").length) : null, badgeCls: "bg-amber-500" },
                    { id: "referrals" as Tab, label: "Liste des parrains",     icon: <UserPlus size={16} />, badge: referrals.length > 0 ? String(referrals.length) : null, badgeCls: "bg-blue-500" },
                  ],
                },
                {
                  label: "Amélioration outil",
                  items: [
                    { id: "suggestions" as Tab, label: "Suggestions", icon: <MessageCircle size={16} />, badge: suggestions.length > 0 ? String(suggestions.length) : null, badgeCls: "bg-gray-400 dark:bg-gray-600" },
                    { id: "roadmap"     as Tab, label: "Roadmap",     icon: <Telescope size={16} />,     badge: null as string | null, badgeCls: "" },
                  ],
                },
                {
                  label: "Communication",
                  items: [
                    { id: "notifications" as Tab, label: "Notifications", icon: <Bell size={16} />, badge: null as string | null, badgeCls: "" },
                    { id: "email"         as Tab, label: "Email",         icon: <Mail size={16} />, badge: null as string | null, badgeCls: "" },
                  ],
                },
                {
                  label: "Analyse",
                  items: [
                    { id: "pmf"      as Tab, label: "PMF",       icon: <TrendingUp size={16} />, badge: null as string | null, badgeCls: "" },
                    { id: "minijeux" as Tab, label: "Mini-jeux", icon: <Gamepad2 size={16} />,    badge: null as string | null, badgeCls: "" },
                  ],
                },
              ]
            ).map((group, gi) => (
              <div key={gi} className={gi > 0 ? "mt-4" : ""}>
                {group.label && (
                  collapsed ? (
                    <div className="my-2 border-t border-gray-200 dark:border-gray-800" />
                  ) : (
                    <p className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600">
                      {group.label}
                    </p>
                  )
                )}
                {group.items.map((item) => {
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                        active
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {item.badge && (
                            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1 text-white ${item.badgeCls}`}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* ─── Contenu principal ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* En-tête de section */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">
              {tab === "overview"      ? "Vue d'ensemble"
               : tab === "users"       ? `Utilisateurs (${totalUsers})`
               : tab === "premium"     ? "Demandes Premium"
               : tab === "suggestions" ? "Suggestions"
               : tab === "pmf"         ? "Product-Market Fit"
               : tab === "minijeux"    ? "Mini-jeux"
               : tab === "roadmap"     ? "Roadmap"
               : tab === "notifications" ? "Notifications"
               : tab === "referrals"    ? `Parrains (${referrals.length})`
               : "Envoi email"}
            </h1>
            <button
              onClick={refreshForTab[tab]}
              disabled={loadingForTab[tab]}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={loadingForTab[tab] ? "animate-spin" : ""} />
              Actualiser
            </button>
          </div>

          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 px-8 py-6">

            {/* ─── Tab Vue d'ensemble ───────────────────────────────────── */}
            {tab === "overview" && (
              <div className="space-y-6">
                {/* Stats globales */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Utilisateurs",        value: usersLoading ? "…" : totalUsers,    icon: <Users size={18} className="text-blue-600 dark:text-blue-400" /> },
                    { label: "Requêtes totales",     value: usersLoading ? "…" : totalRequests, icon: <MessageCircle size={18} className="text-green-600 dark:text-green-400" /> },
                    { label: "Utilisateurs premium", value: usersLoading ? "…" : premiumUsers,  icon: <Crown size={18} className="text-amber-600 dark:text-amber-400" /> },
                  ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-sm text-gray-500 dark:text-gray-400">{s.label}</span></div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Tableau de bord (analyse) */}
                {analyticsError && (
                  <div className="px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{analyticsError}</div>
                )}
                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 size={20} className="animate-spin mr-2" /> Chargement...</div>
                ) : !analytics ? null : (() => {
                  const maxDaily = Math.max(...analytics.dailyViews.map(d => d.views), 1);
                  const maxPage  = Math.max(...analytics.topPages.map(p => p.views), 1);
                  return (
                    <>
                      {/* Metric cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                          { label: "MAU",          value: analytics.mau,        sub: "utilisateurs actifs / 30j", icon: <Users size={18} className="text-blue-600 dark:text-blue-400" />,         bg: "bg-blue-50 dark:bg-blue-950/30"     },
                          { label: "WAU",          value: analytics.wau,        sub: `${analytics.activeUsers.length} identifié${analytics.activeUsers.length > 1 ? "s" : ""} + ${analytics.wau - analytics.activeUsers.length} anon.`,  icon: <TrendingUp size={18} className="text-violet-600 dark:text-violet-400" />, bg: "bg-violet-50 dark:bg-violet-950/30" },
                          { label: "Pages vues",   value: analytics.views30d,   sub: "30 derniers jours",         icon: <MousePointerClick size={18} className="text-emerald-600 dark:text-emerald-400" />, bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                          { label: "Bounce Rate",  value: `${analytics.bounceRate}%`, sub: "sessions 1 page / 30j", icon: <Activity size={18} className="text-amber-600 dark:text-amber-400" />, bg: "bg-amber-50 dark:bg-amber-950/30"   },
                        ].map((m) => (
                          <div key={m.label} className={`${m.bg} border border-gray-200 dark:border-gray-800 rounded-xl p-5`}>
                            <div className="flex items-center gap-2 mb-2">{m.icon}<span className="text-sm text-gray-500 dark:text-gray-400">{m.label}</span></div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{m.value}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{m.sub}</p>
                          </div>
                        ))}
                      </div>

                      {/* Sessions cards */}
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        {[
                          { label: "Sessions (7j)",  value: analytics.sessions7d,  sub: "visites distinctes" },
                          { label: "Sessions (30j)", value: analytics.sessions30d, sub: "visites distinctes" },
                        ].map((m) => (
                          <div key={m.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{m.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{m.value}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{m.sub}</p>
                          </div>
                        ))}
                      </div>

                      {/* Daily page views chart */}
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-6">Pages vues — 30 derniers jours</h2>
                        {/* Each bar is itself the flex-child so height:% resolves against the container's explicit h-32 */}
                        <div className="flex items-end gap-0.5 h-32">
                          {analytics.dailyViews.map((d) => {
                            const pct = Math.round((d.views / maxDaily) * 100);
                            return (
                              <div
                                key={d.date}
                                className="flex-1 relative group bg-blue-500 dark:bg-blue-400 rounded-t-sm transition-all hover:bg-blue-600 dark:hover:bg-blue-300"
                                style={{ height: `${Math.max(pct, d.views > 0 ? 2 : 0)}%` }}
                              >
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                                  <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap text-center">
                                    {d.views} vue{d.views > 1 ? "s" : ""}<br />
                                    <span className="opacity-60">{new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-gray-400 dark:text-gray-600">
                          <span>{new Date(analytics.dailyViews[0]?.date ?? "").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>
                          <span>Aujourd&apos;hui</span>
                        </div>
                      </div>

                      {/* Top pages */}
                      {analytics.topPages.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
                          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">Pages les plus visitées</h2>
                          <div className="space-y-3">
                            {analytics.topPages.map((p) => (
                              <div key={p.path} className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400 w-44 flex-shrink-0 truncate font-mono text-xs">{p.path}</span>
                                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all"
                                    style={{ width: `${Math.round((p.views / maxPage) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums w-10 text-right">{p.views}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Utilisateurs actifs 7j */}
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                          <div className="flex items-start justify-between">
                            <div>
                              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Utilisateurs identifiés actifs — 7 derniers jours
                              </h2>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {analytics.activeUsers.length} utilisateur{analytics.activeUsers.length > 1 ? "s" : ""} connecté{analytics.activeUsers.length > 1 ? "s" : ""} avec pages trackées
                                {analytics.wau - analytics.activeUsers.length > 0 && (
                                  <span className="ml-1">(+ {analytics.wau - analytics.activeUsers.length} visiteur{analytics.wau - analytics.activeUsers.length > 1 ? "s" : ""} anonyme{analytics.wau - analytics.activeUsers.length > 1 ? "s" : ""} non listés)</span>
                                )}
                              </p>
                            </div>
                            <span className="text-[10px] text-gray-300 dark:text-gray-700 mt-0.5">⚠ pages /admin exclues du tracking</span>
                          </div>
                        </div>
                        {analytics.activeUsers.length === 0 ? (
                          <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">Aucun utilisateur connecté ces 7 derniers jours.</div>
                        ) : (
                          <div className="divide-y divide-gray-50 dark:divide-gray-800">
                            {analytics.activeUsers.map((u) => {
                              const initials = ((u.first_name?.[0] ?? "") + (u.last_name?.[0] ?? "")).toUpperCase() || "?";
                              return (
                                <div key={u.id} className="flex items-center justify-between px-6 py-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-blue-700 dark:text-blue-300 text-xs font-semibold">{initials}</span>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">{u.first_name} {u.last_name}</p>
                                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                                    </div>
                                  </div>
                                  <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400 flex-shrink-0 ml-4">
                                    {u.views} page{u.views > 1 ? "s" : ""} vue{u.views > 1 ? "s" : ""}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {analytics.views30d === 0 && (
                        <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                          Aucune donnée pour l&apos;instant — le tracking vient d&apos;être activé.
                        </div>
                      )}
                    </>
                  );
                })()}

              </div>
            )}

        {/* ─── Tab Utilisateurs ─────────────────────────────────────────── */}
        {tab === "users" && (
          <>
            {usersError && (
              <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{usersError}</div>
            )}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Utilisateurs ({totalUsers})</h2>
              </div>
              {usersLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 size={20} className="animate-spin mr-2" /> Chargement...</div>
              ) : users.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">Aucun utilisateur inscrit.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                        <th className="text-left px-6 py-3 font-medium">Utilisateur</th>
                        <th className="text-left px-4 py-3 font-medium">Rôle</th>
                        <th className="text-left px-4 py-3 font-medium w-40">Utilisation</th>
                        <th className="text-left px-4 py-3 font-medium">Statut</th>
                        <th className="text-left px-4 py-3 font-medium">Inscrit le</th>
                        <th className="text-right px-4 py-3 font-medium">Sessions</th>
                        <th className="px-6 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {users.map((u) => {
                        const initials = ((u.first_name?.[0] ?? "") + (u.last_name?.[0] ?? "")).toUpperCase() || "?";
                        const isBusy = actionId === u.id;
                        return (
                          <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer" onClick={() => openUserActivity(u.id)}>
                            {/* Utilisateur */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-700 dark:text-blue-300 text-xs font-semibold">{initials}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{u.first_name} {u.last_name}</p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            {/* Rôle */}
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={u.role}
                                disabled={isBusy}
                                onChange={(e) => setRole(u, e.target.value as UserRow["role"])}
                                className={`text-xs font-medium rounded-full px-2.5 py-0.5 border appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ${
                                  u.role === "admin"
                                    ? "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                                    : u.role === "premium"
                                    ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                                }`}
                              >
                                <option value="user">Utilisateur</option>
                                <option value="premium">Premium</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            {/* Utilisation */}
                            <td className="px-4 py-4 w-40"><UsageBar count={u.totalUsage} limit={u.usage_limit} /></td>
                            {/* Statut d'inscription */}
                            <td className="px-4 py-4">
                              {u.email_confirmed_at ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                  <Check size={10} strokeWidth={2.5} /> Confirmé
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                  <X size={10} strokeWidth={2.5} /> En attente
                                </span>
                              )}
                            </td>
                            {/* Inscrit le */}
                            <td className="px-4 py-4 text-gray-400 dark:text-gray-500 whitespace-nowrap text-xs">
                              {new Date(u.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                            {/* Sessions */}
                            <td className="px-4 py-4 text-right tabular-nums">
                              {u.sessions > 0
                                ? <span className="text-gray-700 dark:text-gray-300 font-medium">{u.sessions}</span>
                                : <span className="text-gray-300 dark:text-gray-700">—</span>}
                            </td>
                            {/* Actions */}
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                {!u.email_confirmed_at && (
                                  <button
                                    onClick={() => confirmEmail(u)}
                                    disabled={isBusy}
                                    title="Confirmer l'email manuellement"
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 disabled:opacity-40 transition-colors"
                                  >
                                    {isBusy ? <Loader2 size={12} className="animate-spin" /> : <MailCheck size={12} />}
                                    Confirmer
                                  </button>
                                )}
                                <button onClick={() => deleteUser(u)} disabled={isBusy} title="Supprimer" className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-40">
                                  {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── Tab Suggestions ──────────────────────────────────────────── */}
        {tab === "suggestions" && (
          <>
            {suggestionsError && (
              <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {suggestionsError}
                <button onClick={() => setSuggestionsError(null)} className="ml-2 underline text-xs">Fermer</button>
              </div>
            )}

            {/* Filtres statut */}
            {!suggestionsLoading && suggestions.length > 0 && (
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                {([
                  { value: "all",      label: "Toutes",     count: suggestions.length },
                  { value: "pending",  label: "En attente", count: suggestions.filter(s => s.status === "pending").length },
                  { value: "planned",  label: "Planifiées", count: suggestions.filter(s => s.status === "planned").length },
                  { value: "done",     label: "Livrées",    count: suggestions.filter(s => s.status === "done").length },
                  { value: "rejected", label: "Refusées",   count: suggestions.filter(s => s.status === "rejected").length },
                ] as { value: SuggestionStatus | "all"; label: string; count: number }[]).map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setSuggFilter(f.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      suggFilter === f.value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    {f.label}
                    <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      suggFilter === f.value ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {suggestionsLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 size={20} className="animate-spin mr-2" /> Chargement...</div>
            ) : suggestions.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">Aucune suggestion reçue pour l&apos;instant.</div>
            ) : (
              <div className="space-y-3">
                {suggestions.filter(s => suggFilter === "all" || s.status === suggFilter).length === 0 ? (
                  <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">Aucune suggestion dans cette catégorie.</div>
                ) : suggestions.filter(s => suggFilter === "all" || s.status === suggFilter).map((s) => {
                  const busy = suggActionId === s.id;
                  const statusMeta: Record<SuggestionStatus, { label: string; cls: string }> = {
                    pending:  { label: "En attente", cls: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"                        },
                    planned:  { label: "Planifiée",  cls: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"                      },
                    done:     { label: "Livrée ✓",   cls: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"    },
                    rejected: { label: "Refusée",    cls: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"                            },
                  };
                  const sm = statusMeta[s.status ?? "pending"];
                  return (
                    <div key={s.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CategoryBadge category={s.category} />
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${sm.cls}`}>
                            {sm.label}
                          </span>
                          {s.profiles && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {s.profiles.first_name} {s.profiles.last_name}
                              <span className="text-gray-300 dark:text-gray-600 mx-1">·</span>
                              {s.profiles.email}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                          {new Date(s.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Message */}
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">{s.message}</p>

                      {/* Motif de refus */}
                      {s.status === "rejected" && s.rejection_reason && (
                        <div className="mb-4 px-3 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Motif du refus</p>
                          <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{s.rejection_reason}</p>
                        </div>
                      )}

                      {/* Formulaire de refus inline */}
                      {rejectingId === s.id && (
                        <div className="mb-4 space-y-2">
                          <textarea
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Motif du refus (optionnel)..."
                            className="w-full rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              disabled={busy}
                              onClick={() => rejectSuggestion(s.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/60 disabled:opacity-50 transition-colors"
                            >
                              {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                              Confirmer le refus
                            </button>
                            <button
                              onClick={() => { setRejectingId(null); setRejectReason(""); }}
                              className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-gray-50 dark:border-gray-800">
                        {/* Supprimer */}
                        <button
                          disabled={busy}
                          onClick={() => deleteSuggestion(s.id)}
                          title="Supprimer"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-40 mr-1"
                        >
                          {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                        {/* Statut → Planifiée */}
                        {s.status !== "planned" && s.status !== "done" && s.status !== "rejected" && (
                          <>
                            <button
                              disabled={busy}
                              onClick={() => updateSuggestion(s.id, "planned", false)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                              {busy ? <Loader2 size={12} className="animate-spin" /> : null}
                              Planifier
                            </button>
                            <button
                              disabled={busy || !s.profiles}
                              onClick={() => updateSuggestion(s.id, "planned", true)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 disabled:opacity-50 transition-colors"
                            >
                              {busy ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
                              Planifier + notifier
                            </button>
                          </>
                        )}

                        {/* Statut → Livrée */}
                        {s.status !== "done" && s.status !== "rejected" && (
                          <>
                            <button
                              disabled={busy}
                              onClick={() => updateSuggestion(s.id, "done", false)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                              {busy ? <Loader2 size={12} className="animate-spin" /> : null}
                              Marquer livrée
                            </button>
                            <button
                              disabled={busy || !s.profiles}
                              onClick={() => updateSuggestion(s.id, "done", true)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 disabled:opacity-50 transition-colors"
                            >
                              {busy ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
                              Livrée + notifier
                            </button>
                          </>
                        )}

                        {/* Statut → Refusée */}
                        {s.status !== "done" && s.status !== "rejected" && rejectingId !== s.id && (
                          <button
                            disabled={busy}
                            onClick={() => { setRejectingId(s.id); setRejectReason(""); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 transition-colors"
                          >
                            <X size={12} /> Refuser
                          </button>
                        )}

                        {/* Re-notifier si déjà livrée */}
                        {s.status === "done" && s.profiles && (
                          <button
                            disabled={busy}
                            onClick={() => updateSuggestion(s.id, "done", true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                          >
                            {busy ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
                            Renvoyer la notification
                          </button>
                        )}

                        {/* Horodatage email */}
                        {s.email_sent_at && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                            ✉ notifié le {new Date(s.email_sent_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        {/* ─── Tab Mini-jeux ────────────────────────────────────────────── */}
        {tab === "minijeux" && (() => {
          const active = users.filter((u) => u.totalMiniGames > 0);
          const totalAllGames = users.reduce((s, u) => s + u.totalMiniGames, 0);

          const GAME_META: Record<string, { icon: React.ReactNode; colorText: string }> = {
            draw:       { icon: <PenLine size={14} />,   colorText: "text-orange-600 dark:text-orange-400" },
            tvml:       { icon: <Scale size={14} />,     colorText: "text-purple-600 dark:text-purple-400" },
            anecdotes:  { icon: <BookOpen size={14} />,  colorText: "text-emerald-600 dark:text-emerald-400" },
            icebreaker: { icon: <Gamepad2 size={14} />,  colorText: "text-blue-600 dark:text-blue-400" },
            chaine:     { icon: <Link2 size={14} />,     colorText: "text-rose-600 dark:text-rose-400" },
          };

          const COLOR_BAR: Record<string, string> = {
            orange:  "bg-orange-500 dark:bg-orange-400",
            purple:  "bg-purple-500 dark:bg-purple-400",
            emerald: "bg-emerald-500 dark:bg-emerald-400",
            blue:    "bg-blue-500 dark:bg-blue-400",
            rose:    "bg-rose-500 dark:bg-rose-400",
            amber:   "bg-amber-500 dark:bg-amber-400",
          };

          const COLOR_BG: Record<string, string> = {
            orange:  "bg-orange-50 dark:bg-orange-950/40",
            purple:  "bg-purple-50 dark:bg-purple-950/40",
            emerald: "bg-emerald-50 dark:bg-emerald-950/40",
            blue:    "bg-blue-50 dark:bg-blue-950/40",
            rose:    "bg-rose-50 dark:bg-rose-950/40",
            amber:   "bg-amber-50 dark:bg-amber-950/40",
          };

          return (
            <>
              {minijeuxError && (
                <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{minijeuxError}</div>
              )}

              {/* ── Graphique sessions quotidiennes ─────────────────────── */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Sessions créées — 30 derniers jours</h2>
                  <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{totalAllGames} session{totalAllGames > 1 ? "s" : ""} au total</span>
                </div>
                {minijeuxLoading ? (
                  <div className="flex items-center justify-center h-32 text-gray-400"><Loader2 size={18} className="animate-spin mr-2" />Chargement…</div>
                ) : minijeuxData ? (() => {
                  const maxCount = Math.max(...minijeuxData.dailySessions.map(d => d.count), 1);
                  return (
                    <>
                      <div className="flex items-end gap-0.5 h-32">
                        {minijeuxData.dailySessions.map((d) => {
                          const pct = Math.round((d.count / maxCount) * 100);
                          return (
                            <div
                              key={d.date}
                              className="flex-1 relative group bg-violet-500 dark:bg-violet-400 rounded-t-sm transition-all hover:bg-violet-600 dark:hover:bg-violet-300"
                              style={{ height: `${Math.max(pct, d.count > 0 ? 3 : 0)}%` }}
                            >
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                                <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap text-center">
                                  {d.count} session{d.count > 1 ? "s" : ""}<br />
                                  <span className="opacity-60">{new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] text-gray-400 dark:text-gray-600">
                        <span>{new Date(minijeuxData.dailySessions[0]?.date ?? "").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>
                        <span>Aujourd&apos;hui</span>
                      </div>
                    </>
                  );
                })() : null}
              </div>

              {/* ── Liste des jeux ──────────────────────────────────────── */}
              {minijeuxData && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">Jeux disponibles</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {minijeuxData.games.map((g) => {
                      const maxTotal = Math.max(...minijeuxData.games.map(x => x.total), 1);
                      return (
                        <div key={g.key} className={`${COLOR_BG[g.color] ?? "bg-gray-50 dark:bg-gray-800"} rounded-xl p-4 border border-gray-100 dark:border-gray-800`}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className={GAME_META[g.key]?.colorText ?? "text-gray-500"}>{GAME_META[g.key]?.icon}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{g.label}</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{g.total}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 mb-3">session{g.total > 1 ? "s" : ""} créée{g.total > 1 ? "s" : ""}</p>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 h-1.5 bg-white/60 dark:bg-gray-900/60 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${COLOR_BAR[g.color] ?? "bg-gray-400"} rounded-full transition-all`}
                                style={{ width: `${Math.round((g.total / maxTotal) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {g.last7d > 0
                              ? <span className="text-gray-600 dark:text-gray-400 font-medium">+{g.last7d}</span>
                              : "0"
                            }
                            {" "}cette semaine
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Tableau par utilisateur ─────────────────────────────── */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Utilisation par utilisateur — {active.length} utilisateur{active.length > 1 ? "s" : ""} actif{active.length > 1 ? "s" : ""}
                  </h2>
                </div>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-400"><Loader2 size={20} className="animate-spin mr-2" />Chargement…</div>
                ) : active.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">Aucune session mini-jeu créée pour l&apos;instant.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                          <th className="text-left px-6 py-3 font-medium">Utilisateur</th>
                          <th className="text-right px-3 py-3 font-medium">
                            <span className="flex items-center justify-end gap-1"><PenLine size={11} />Draw</span>
                          </th>
                          <th className="text-right px-3 py-3 font-medium">
                            <span className="flex items-center justify-end gap-1"><Scale size={11} />TVML</span>
                          </th>
                          <th className="text-right px-3 py-3 font-medium">
                            <span className="flex items-center justify-end gap-1"><BookOpen size={11} />Anec.</span>
                          </th>
                          <th className="text-right px-3 py-3 font-medium">
                            <span className="flex items-center justify-end gap-1"><Gamepad2 size={11} />Ice.</span>
                          </th>
                          <th className="text-right px-3 py-3 font-medium">
                            <span className="flex items-center justify-end gap-1"><Link2 size={11} />Chaîne</span>
                          </th>
                          <th className="text-right px-6 py-3 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {[...active].sort((a, b) => b.totalMiniGames - a.totalMiniGames).map((u) => {
                          const initials = ((u.first_name?.[0] ?? "") + (u.last_name?.[0] ?? "")).toUpperCase() || "?";
                          const cells: { val: number; cls: string }[] = [
                            { val: u.mini_games.draw,       cls: "text-orange-600 dark:text-orange-400" },
                            { val: u.mini_games.tvml,       cls: "text-purple-600 dark:text-purple-400" },
                            { val: u.mini_games.anecdotes,  cls: "text-emerald-600 dark:text-emerald-400" },
                            { val: u.mini_games.icebreaker, cls: "text-blue-600 dark:text-blue-400" },
                            { val: u.mini_games.chaine,     cls: "text-rose-600 dark:text-rose-400" },
                          ];
                          return (
                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-blue-700 dark:text-blue-300 text-xs font-semibold">{initials}</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{u.first_name} {u.last_name}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              {cells.map((c, i) => (
                                <td key={i} className="px-3 py-3 text-right tabular-nums">
                                  {c.val > 0
                                    ? <span className={`${c.cls} font-medium`}>{c.val}</span>
                                    : <span className="text-gray-300 dark:text-gray-700">—</span>}
                                </td>
                              ))}
                              <td className="px-6 py-3 text-right">
                                <span className="font-semibold text-gray-900 dark:text-white">{u.totalMiniGames}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* ─── Tab Premium ──────────────────────────────────────────────── */}
        {tab === "premium" && (
          <>
            {premiumError && (
              <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {premiumError}
                <button onClick={() => setPremiumError(null)} className="ml-2 underline text-xs">Fermer</button>
              </div>
            )}
            {premiumLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <Loader2 size={20} className="animate-spin mr-2" /> Chargement...
              </div>
            ) : premiumRequests.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
                Aucune demande Premium reçue pour l&apos;instant.
              </div>
            ) : (
              <div className="space-y-3">
                {premiumRequests.map((r) => {
                  const busy = premiumActionId === r.id;
                  const statusMeta: Record<PremiumRequestStatus, { label: string; cls: string }> = {
                    pending:  { label: "En attente",  cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"       },
                    approved: { label: "Approuvée ✓", cls: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
                    rejected: { label: "Rejetée",     cls: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"                   },
                  };
                  const sm = statusMeta[r.status];
                  return (
                    <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                      <div className="flex items-center justify-between gap-4">
                        {/* User info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                            <Crown size={14} className="text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            {r.profiles ? (
                              <>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {r.profiles.first_name} {r.profiles.last_name}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{r.profiles.email}</p>
                              </>
                            ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic">Utilisateur supprimé</p>
                            )}
                          </div>
                        </div>

                        {/* Right: status + date + actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${sm.cls}`}>
                            {sm.label}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>

                          {/* Actions — only when pending */}
                          {r.status === "pending" && (
                            <div className="flex items-center gap-1.5">
                              <button
                                disabled={busy}
                                onClick={() => handlePremiumAction(r.id, "approve")}
                                title="Approuver"
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/60 disabled:opacity-50 transition-colors"
                              >
                                {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                Approuver
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => handlePremiumAction(r.id, "reject")}
                                title="Rejeter"
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                              >
                                {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                                Rejeter
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ─── Tab PMF ──────────────────────────────────────────────────── */}
        {tab === "pmf" && (
          <>
            {pmfError && (
              <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{pmfError}</div>
            )}

            {/* Distribution */}
            {pmf.length > 0 && (() => {
              const counts = {
                very_disappointed:     pmf.filter(r => r.answer === "very_disappointed").length,
                somewhat_disappointed: pmf.filter(r => r.answer === "somewhat_disappointed").length,
                not_disappointed:      pmf.filter(r => r.answer === "not_disappointed").length,
              };
              const total = pmf.length;
              const pctVery = Math.round(counts.very_disappointed / total * 100);
              const rows = [
                { key: "very_disappointed",     label: "😢 Très déçu",       count: counts.very_disappointed,     color: "bg-emerald-500" },
                { key: "somewhat_disappointed", label: "😕 Assez déçu",       count: counts.somewhat_disappointed, color: "bg-amber-400"  },
                { key: "not_disappointed",      label: "🤷 Pas vraiment",     count: counts.not_disappointed,      color: "bg-gray-300 dark:bg-gray-600"   },
              ];
              return (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Distribution des réponses</h2>
                    <span className={`text-sm font-bold ${pctVery >= 40 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}>
                      {pctVery}% très déçus
                    </span>
                  </div>
                  <div className="space-y-3">
                    {rows.map(r => (
                      <div key={r.key} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-36 flex-shrink-0">{r.label}</span>
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${r.color} rounded-full transition-all`}
                            style={{ width: total > 0 ? `${Math.round(r.count / total * 100)}%` : "0%" }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums w-16 text-right">
                          {r.count} ({total > 0 ? Math.round(r.count / total * 100) : 0}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {pmfLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 size={20} className="animate-spin mr-2" /> Chargement...</div>
            ) : pmf.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">Aucune réponse PMF pour l&apos;instant.</div>
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Réponses individuelles ({pmf.length})</h2>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {pmf.map((r) => {
                    const meta = {
                      very_disappointed:     { label: "😢 Très déçu",    cls: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
                      somewhat_disappointed: { label: "😕 Assez déçu",    cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"   },
                      not_disappointed:      { label: "🤷 Pas vraiment",  cls: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"             },
                    }[r.answer];
                    return (
                      <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {r.profiles ? (
                            <>
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                  {((r.profiles.first_name?.[0] ?? "") + (r.profiles.last_name?.[0] ?? "")).toUpperCase() || "?"}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {r.profiles.first_name} {r.profiles.last_name}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{r.profiles.email}</p>
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500 italic">Utilisateur supprimé</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${meta.cls}`}>
                            {meta.label}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── Tab Roadmap ──────────────────────────────────────────────── */}
        {tab === "roadmap" && (
          <>
            {roadmapError && (
              <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {roadmapError}
                <button onClick={() => setRoadmapError(null)} className="ml-2 underline text-xs">Fermer</button>
              </div>
            )}

            {roadmapLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 size={20} className="animate-spin mr-2" /> Chargement...</div>
            ) : (
              <div className="grid grid-cols-4 gap-6">
                {(([
                  { key: "now"      as RoadmapPhase, label: "Now",      dot: "bg-emerald-500", border: "border-emerald-200 dark:border-emerald-800", bg: "bg-emerald-50 dark:bg-emerald-950/40", color: "text-emerald-700 dark:text-emerald-400" },
                  { key: "next"     as RoadmapPhase, label: "Next",     dot: "bg-orange-500",  border: "border-orange-200 dark:border-orange-800",   bg: "bg-orange-50 dark:bg-orange-950/40",   color: "text-orange-700 dark:text-orange-400"   },
                  { key: "later"    as RoadmapPhase, label: "Later",    dot: "bg-blue-400",    border: "border-blue-200 dark:border-blue-800",       bg: "bg-blue-50 dark:bg-blue-950/40",       color: "text-blue-700 dark:text-blue-400"       },
                  { key: "released" as RoadmapPhase, label: "Released", dot: "bg-purple-500",  border: "border-purple-200 dark:border-purple-800",   bg: "bg-purple-50 dark:bg-purple-950/40",   color: "text-purple-700 dark:text-purple-400"   },
                ]) as { key: RoadmapPhase; label: string; dot: string; border: string; bg: string; color: string }[]).map(({ key, label, dot, border, bg, color }) => {
                  const items = [...roadmapItems.filter(i => i.phase === key)].sort((a, b) => a.sort_order - b.sort_order);
                  const isAdding = roadmapAddPhase === key;

                  return (
                    <div key={key}>
                      {/* Column header */}
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border mb-4 ${bg} ${border}`}>
                        <span className={`w-2 h-2 rounded-full ${dot}`} />
                        <span className={`text-xs font-bold tracking-wide uppercase ${color}`}>{label}</span>
                        <span className={`text-xs ${color} opacity-60 tabular-nums`}>{items.length}</span>
                      </div>

                      {/* Items */}
                      <div
                        className={`space-y-2 mb-3 min-h-[80px] rounded-xl transition-colors ${
                          roadmapDragOverPhase === key ? "bg-gray-50 dark:bg-gray-800/40 ring-2 ring-dashed ring-gray-300 dark:ring-gray-700" : ""
                        }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={() => { if (roadmapDragId) setRoadmapDragOverPhase(key); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (roadmapDragId) moveRoadmapItem(key, roadmapDragId, null);
                          setRoadmapDragId(null);
                          setRoadmapDragOverId(null);
                          setRoadmapDragOverPhase(null);
                        }}
                      >
                        {items.map((item) => {
                          const busy = roadmapActionId === item.id;
                          const isDragging = roadmapDragId === item.id;
                          const isDragOver = roadmapDragOverId === item.id;

                          return (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={() => setRoadmapDragId(item.id)}
                              onDragEnter={(e) => { e.stopPropagation(); if (roadmapDragId && roadmapDragId !== item.id) setRoadmapDragOverId(item.id); }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (roadmapDragId && roadmapDragId !== item.id) moveRoadmapItem(key, roadmapDragId, item.id);
                                setRoadmapDragId(null);
                                setRoadmapDragOverId(null);
                                setRoadmapDragOverPhase(null);
                              }}
                              onDragEnd={() => { setRoadmapDragId(null); setRoadmapDragOverId(null); setRoadmapDragOverPhase(null); }}
                              className={`bg-white dark:bg-gray-900 border rounded-xl p-3 transition-all ${
                                isDragging ? "opacity-40" : ""
                              } ${
                                isDragOver ? "border-blue-400 dark:border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900/60" : "border-gray-200 dark:border-gray-800"
                              }`}
                            >
                              <div className="space-y-2">
                                {/* Ligne haute : tag à gauche, actions à droite */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-700">
                                      <GripVertical size={14} />
                                    </div>
                                    {item.tag ? (
                                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 truncate">
                                        {item.tag}
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-gray-300 dark:text-gray-700">—</span>
                                    )}
                                    {(item.likes_count ?? 0) > 0 && (
                                      <div className="flex items-center gap-1 flex-shrink-0 px-1.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                                        <ThumbsUp size={11} className="fill-blue-600 dark:fill-blue-400" />
                                        <span className="text-[11px] font-semibold tabular-nums">{item.likes_count}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <button onClick={() => startEditRoadmap(item)} disabled={busy} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors disabled:opacity-40">
                                      <PenLine size={12} />
                                    </button>
                                    <button onClick={() => deleteRoadmapItem(item.id)} disabled={busy} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-40">
                                      {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    </button>
                                  </div>
                                </div>
                                {/* Titre pleine largeur */}
                                <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">{item.title}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add form or button */}
                      {isAdding ? (
                        <RoadmapItemForm
                          form={roadmapForm}
                          setForm={setRoadmapForm}
                          onSave={() => createRoadmapItem(key)}
                          onCancel={() => { setRoadmapAddPhase(null); setRoadmapForm({ title: "", description: "", tag: "" }); }}
                          saving={roadmapActionId === "new"}
                        />
                      ) : (
                        <button
                          onClick={() => { setRoadmapAddPhase(key); setRoadmapEditId(null); setRoadmapForm({ title: "", description: "", tag: "" }); }}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          <Plus size={13} /> Ajouter
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Modale édition ───────────────────────────────────────── */}
            {roadmapEditId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                  onClick={() => { setRoadmapEditId(null); setRoadmapForm({ title: "", description: "", tag: "" }); }}
                />
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-8">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Modifier l&apos;élément</p>
                  <RoadmapItemForm
                    form={roadmapForm}
                    setForm={setRoadmapForm}
                    onSave={() => updateRoadmapItem(roadmapEditId)}
                    onCancel={() => { setRoadmapEditId(null); setRoadmapForm({ title: "", description: "", tag: "" }); }}
                    saving={roadmapActionId === roadmapEditId}
                  />
                </div>
              </div>
            )}
          </>
        )}
        {/* ─── Tab Notifications ────────────────────────────────────────── */}
        {tab === "notifications" && (
          <div className="space-y-8">
            {notifError && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{notifError}</div>
            )}

            {/* ── Envoi one-shot ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Send size={15} className="text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Envoi one-shot</h2>
              </div>
              <div className="px-6 py-5 space-y-3">
                {notifSendSuccess && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
                    <CheckCircle2 size={14} /> {notifSendSuccess}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Titre *"
                      value={notifForm.title}
                      onChange={e => setNotifForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <textarea
                      rows={2}
                      placeholder="Corps du message (optionnel)"
                      value={notifForm.body}
                      onChange={e => setNotifForm(f => ({ ...f, body: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <select
                      value={notifForm.type}
                      onChange={e => setNotifForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="info">Info</option>
                      <option value="success">Succès</option>
                      <option value="warning">Avertissement</option>
                      <option value="new_feature">Nouveauté</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Destinataires</label>
                    <select
                      value={notifForm.target}
                      onChange={e => { setNotifForm(f => ({ ...f, target: e.target.value })); setNotifUserIds([]); setNotifUserSearch(""); }}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tous les utilisateurs ({users.length})</option>
                      <option value="premium">Premium et Admin uniquement ({users.filter(u => u.role === "premium" || u.role === "admin").length})</option>
                      <option value="admin">Admins uniquement ({users.filter(u => u.role === "admin").length})</option>
                      <option value="specific">Sélection manuelle…</option>
                    </select>

                    {notifForm.target === "specific" && (
                      <div className="mt-3 space-y-2">
                        <input
                          type="text"
                          placeholder="Rechercher par nom ou email…"
                          value={notifUserSearch}
                          onChange={e => setNotifUserSearch(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                          {users
                            .filter(u => {
                              const q = notifUserSearch.toLowerCase();
                              return !q || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q);
                            })
                            .map(u => {
                              const checked = notifUserIds.includes(u.id);
                              return (
                                <label key={u.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={e => setNotifUserIds(prev => e.target.checked ? [...prev, u.id] : prev.filter(id => id !== u.id))}
                                    className="w-3.5 h-3.5 rounded accent-blue-600 flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{u.first_name} {u.last_name}</p>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                                  </div>
                                  <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${
                                    u.role === "admin"   ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" :
                                    u.role === "premium" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" :
                                    "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                                  }`}>{u.role === "admin" ? "Admin" : u.role === "premium" ? "Premium" : "User"}</span>
                                </label>
                              );
                            })}
                          {users.filter(u => {
                            const q = notifUserSearch.toLowerCase();
                            return !q || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q);
                          }).length === 0 && (
                            <p className="py-6 text-center text-xs text-gray-400">Aucun résultat</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            {notifUserIds.length > 0 ? `${notifUserIds.length} sélectionné(s)` : "Aucune sélection"}
                          </p>
                          {notifUserIds.length > 0 && (
                            <button onClick={() => setNotifUserIds([])} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                              Tout désélectionner
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Lien (ex: /roadmap) — optionnel"
                      value={notifForm.href}
                      onChange={e => setNotifForm(f => ({ ...f, href: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={sendOneShot}
                  disabled={notifSending || !notifForm.title.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
                >
                  {notifSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Envoyer maintenant
                </button>
              </div>
            </div>

            {/* ── Templates automatiques ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-purple-600 dark:text-purple-400" />
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Templates automatiques</h2>
                </div>
                <button
                  onClick={() => setShowAddTemplate((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Plus size={12} /> Nouveau
                </button>
              </div>

              {showAddTemplate && (
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 space-y-3">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Titre *"
                    value={templateForm.title}
                    onChange={e => setTemplateForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    rows={2}
                    placeholder="Corps"
                    value={templateForm.body}
                    onChange={e => setTemplateForm(f => ({ ...f, body: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={templateForm.type}
                      onChange={e => setTemplateForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="info">Info</option>
                      <option value="success">Succès</option>
                      <option value="warning">Avertissement</option>
                      <option value="new_feature">Nouveauté</option>
                    </select>
                    <div>
                      <select
                        value={triggerCustom ? "__custom__" : templateForm.trigger_event}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === "__custom__") {
                            setTriggerCustom(true);
                            setTemplateForm(f => ({ ...f, trigger_event: "" }));
                          } else {
                            setTriggerCustom(false);
                            setTemplateForm(f => ({ ...f, trigger_event: v }));
                          }
                        }}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— Aucun déclencheur (manuel) —</option>
                        {TRIGGER_EVENT_GROUPS.map(group => (
                          <optgroup key={group.label} label={group.label}>
                            {group.options.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </optgroup>
                        ))}
                        <option value="__custom__">Autre (personnalisé)…</option>
                      </select>
                      {triggerCustom && (
                        <input
                          autoFocus
                          type="text"
                          placeholder="Code de l'événement (ex: mon_evenement)"
                          value={templateForm.trigger_event}
                          onChange={e => setTemplateForm(f => ({ ...f, trigger_event: e.target.value }))}
                          className="w-full mt-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Lien (optionnel)"
                    value={templateForm.href}
                    onChange={e => setTemplateForm(f => ({ ...f, href: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveTemplate}
                      disabled={templateSaving || !templateForm.title.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
                    >
                      {templateSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setShowAddTemplate(false)}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <div>
                {notifLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-400">
                    <Loader2 size={18} className="animate-spin mr-2" /> Chargement…
                  </div>
                ) : notifTemplates.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                    Aucun template. Créez-en un pour automatiser des notifications.
                  </div>
                ) : (
                  notifTemplates.map((tpl) => {
                    const typeIcons: Record<string, React.ReactNode> = {
                      info:        <Info size={13} className="text-blue-500" />,
                      success:     <CheckCircle2 size={13} className="text-green-500" />,
                      warning:     <AlertTriangle size={13} className="text-amber-500" />,
                      new_feature: <Sparkles size={13} className="text-purple-500" />,
                    };
                    return (
                      <div key={tpl.id} className="flex items-start gap-4 px-6 py-4 border-b border-gray-50 dark:border-gray-800 last:border-0">
                        <div className="w-6 h-6 rounded-md bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {typeIcons[tpl.type] ?? typeIcons.info}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tpl.title}</p>
                          {tpl.body && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{tpl.body}</p>}
                          {tpl.trigger_event && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-mono bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded">
                              {tpl.trigger_event}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => toggleTemplate(tpl.id, !tpl.is_active)}
                            title={tpl.is_active ? "Désactiver" : "Activer"}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                          >
                            {tpl.is_active
                              ? <ToggleRight size={18} className="text-blue-500" />
                              : <ToggleLeft size={18} />
                            }
                          </button>
                          <button
                            onClick={() => deleteTemplate(tpl.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Tab Email ────────────────────────────────────────────────── */}
        {tab === "email" && (
          <>
          <div className="grid grid-cols-2 gap-6 items-start">

            {/* ── Composer ── */}
            <div className="space-y-5">
              {emailError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                  <X size={14} className="flex-shrink-0" />
                  {emailError}
                  <button onClick={() => setEmailError(null)} className="ml-auto underline text-xs">Fermer</button>
                </div>
              )}
              {emailSuccess && (
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 size={14} className="flex-shrink-0" />
                  {emailSuccess}
                  <button onClick={() => setEmailSuccess(null)} className="ml-auto underline text-xs">Fermer</button>
                </div>
              )}

              {/* Sujet */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sujet</label>
                <input
                  type="text"
                  placeholder="Objet de l'email *"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Blocs de contenu */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contenu</p>
                </div>

                <div className="p-4 space-y-3">
                  {emailBlocks.map((block, idx) => (
                    <div key={block.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                      {/* Block header */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          {block.type === "text"    && <><Type size={12} /> Texte</>}
                          {block.type === "callout" && <><Info size={12} /> Encadré bleu</>}
                          {block.type === "cta"     && <><SquareMousePointer size={12} /> Bouton CTA</>}
                          {block.type === "image"   && <><ImageIcon size={12} /> Image</>}
                        </span>
                        <div className="ml-auto flex items-center gap-0.5">
                          <button onClick={() => moveEmailBlock(block.id, "up")} disabled={idx === 0} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 transition-colors">
                            <ArrowUp size={12} />
                          </button>
                          <button onClick={() => moveEmailBlock(block.id, "down")} disabled={idx === emailBlocks.length - 1} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 transition-colors">
                            <ArrowDown size={12} />
                          </button>
                          <button onClick={() => removeEmailBlock(block.id)} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Block fields */}
                      <div className="p-3 space-y-2">
                        {block.type === "text" && (
                          <>
                            <textarea
                              rows={3}
                              placeholder="Votre texte…"
                              value={block.content}
                              onChange={e => updateEmailBlock(block.id, { content: e.target.value })}
                              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                                <input
                                  type="checkbox"
                                  checked={block.bold}
                                  onChange={e => updateEmailBlock(block.id, { bold: e.target.checked })}
                                  className="w-3.5 h-3.5 rounded accent-blue-600"
                                />
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Mettre en gras</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                                <input
                                  type="checkbox"
                                  checked={block.italic}
                                  onChange={e => updateEmailBlock(block.id, { italic: e.target.checked })}
                                  className="w-3.5 h-3.5 rounded accent-blue-600"
                                />
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1"><Italic size={11} /> Mettre en italique</span>
                              </label>
                            </div>
                          </>
                        )}
                        {block.type === "callout" && (
                          <textarea
                            rows={3}
                            placeholder="Texte à mettre en avant dans un encadré bleu…"
                            value={block.content}
                            onChange={e => updateEmailBlock(block.id, { content: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        )}
                        {block.type === "cta" && (
                          <>
                            <input
                              type="text"
                              placeholder="Libellé du bouton"
                              value={block.label}
                              onChange={e => updateEmailBlock(block.id, { label: e.target.value })}
                              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="url"
                              placeholder="URL de destination (https://…)"
                              value={block.url}
                              onChange={e => updateEmailBlock(block.id, { url: e.target.value })}
                              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </>
                        )}
                        {block.type === "image" && (
                          <>
                            {/* Upload */}
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                                {uploadingBlockId === block.id
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : <Upload size={12} />}
                                Télécharger une image
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                                  className="hidden"
                                  disabled={uploadingBlockId === block.id}
                                  onChange={e => handleImageUpload(block.id, e.target.files?.[0])}
                                />
                              </label>
                              <span className="text-xs text-gray-400">ou URL :</span>
                            </div>
                            <input
                              type="url"
                              placeholder="https://…"
                              value={block.src}
                              onChange={e => updateEmailBlock(block.id, { src: e.target.value })}
                              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Texte alternatif (optionnel)"
                              value={block.alt}
                              onChange={e => updateEmailBlock(block.id, { alt: e.target.value })}
                              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {block.src && (
                              <img src={block.src} alt={block.alt} className="max-h-24 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Ajouter un bloc */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500">Ajouter :</span>
                    {(["text", "callout", "cta", "image"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => addEmailBlock(t)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        {t === "text"    && <><Type size={11} /> Texte</>}
                        {t === "callout" && <><Info size={11} /> Encadré</>}
                        {t === "cta"     && <><SquareMousePointer size={11} /> CTA</>}
                        {t === "image"   && <><ImageIcon size={11} /> Image</>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Destinataires + envoi */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Destinataires</label>
                  <select
                    value={emailTarget}
                    onChange={e => { setEmailTarget(e.target.value as "all" | "premium" | "specific"); setEmailUserIds([]); setEmailUserSearch(""); }}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les utilisateurs confirmés ({users.filter(u => u.email_confirmed_at).length})</option>
                    <option value="premium">Premium et Admin uniquement ({users.filter(u => u.role === "premium" || u.role === "admin").length})</option>
                    <option value="specific">Sélection manuelle…</option>
                  </select>

                  {/* Sélection spécifique */}
                  {emailTarget === "specific" && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        placeholder="Rechercher par nom ou email…"
                        value={emailUserSearch}
                        onChange={e => setEmailUserSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                        {users
                          .filter(u => {
                            const q = emailUserSearch.toLowerCase();
                            return !q || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q);
                          })
                          .map(u => {
                            const checked = emailUserIds.includes(u.id);
                            return (
                              <label key={u.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={e => setEmailUserIds(prev => e.target.checked ? [...prev, u.id] : prev.filter(id => id !== u.id))}
                                  className="w-3.5 h-3.5 rounded accent-blue-600 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{u.first_name} {u.last_name}</p>
                                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                                </div>
                                <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${
                                  u.role === "admin"   ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" :
                                  u.role === "premium" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" :
                                  "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                                }`}>{u.role === "admin" ? "Admin" : u.role === "premium" ? "Premium" : "User"}</span>
                              </label>
                            );
                          })}
                        {users.filter(u => {
                          const q = emailUserSearch.toLowerCase();
                          return !q || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q);
                        }).length === 0 && (
                          <p className="py-6 text-center text-xs text-gray-400">Aucun résultat</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {emailUserIds.length > 0 ? `${emailUserIds.length} sélectionné(s)` : "Aucune sélection"}
                        </p>
                        {emailUserIds.length > 0 && (
                          <button onClick={() => setEmailUserIds([])} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                            Tout désélectionner
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={sendBroadcastEmail}
                  disabled={emailSending || !emailSubject.trim() || emailBlocks.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
                >
                  {emailSending ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                  {emailSending ? "Envoi en cours…" : "Envoyer l'email"}
                </button>
              </div>
            </div>

            {/* ── Aperçu ── */}
            <div className="sticky top-6">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Aperçu en direct</p>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-7 max-w-sm mx-auto shadow-sm">
                  {/* Logo */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/posture-logo-beta-black.png" alt="Posture" className="h-6 w-auto mb-7 dark:hidden" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/posture-logo-beta-white.png" alt="Posture" className="h-6 w-auto mb-7 hidden dark:block" />
                  {/* Greeting */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">Bonjour [Prénom],</p>
                  {/* Blocks */}
                  {emailBlocks.map((block) => <EmailBlockPreview key={block.id} block={block} />)}
                  {/* Footer */}
                  <hr className="my-5 border-gray-100 dark:border-gray-800" />
                  <p className="text-xs text-gray-400">
                    <span className="text-indigo-500">posture.pamoreau.xyz</span>
                  </p>
                </div>
              </div>
              {emailSubject && (
                <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
                  Sujet : <span className="font-medium text-gray-600 dark:text-gray-300">{emailSubject}</span>
                </p>
              )}
            </div>

          </div>

          {/* ── Historique des envois ── */}
          <div className="mt-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <History size={15} className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Historique des envois</h2>
              {emailHistoryLoading && <Loader2 size={13} className="animate-spin text-gray-400 ml-1" />}
            </div>
            {emailHistoryLoading && emailHistory.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <Loader2 size={18} className="animate-spin mr-2" /> Chargement…
              </div>
            ) : emailHistory.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                Aucun email envoyé pour l&apos;instant. La migration SQL doit aussi être appliquée.
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {emailHistory.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => openBroadcastDetail(entry.id)}
                    className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
                      <Mail size={14} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.subject}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                          <User size={10} /> {entry.target_label}
                        </span>
                        <span className="text-gray-300 dark:text-gray-700">·</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {entry.sent_count} envoyé{entry.sent_count > 1 ? "s" : ""}
                        </span>
                        <span className="text-gray-300 dark:text-gray-700">·</span>
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                          <Eye size={10} /> {entry.opens ?? 0}
                        </span>
                        <span className="text-gray-300 dark:text-gray-700">·</span>
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-blue-600 dark:text-blue-400">
                          <MousePointerClick size={10} /> {entry.clicks ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        entry.target === "premium"  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" :
                        entry.target === "specific" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" :
                        "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                      }`}>
                        {entry.target === "premium" ? "Premium" : entry.target === "specific" ? "Spécifique" : "Tous"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          </>
        )}

            {/* ─── Tab Parrains ─────────────────────────────────────────── */}
            {tab === "referrals" && (
              <div className="space-y-4">
                {referralsError && (
                  <div className="px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{referralsError}</div>
                )}

                {/* Stats rapides */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Parrains actifs",      value: referrals.length },
                    { label: "Objectif atteint (3+)", value: referrals.filter(r => r.referral_count >= 3).length },
                    { label: "Total parrainages",     value: referrals.reduce((s, r) => s + r.referral_count, 0) },
                  ].map((m) => (
                    <div key={m.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{m.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{m.value}</p>
                    </div>
                  ))}
                </div>

                {referralsLoading ? (
                  <div className="flex items-center justify-center py-16 text-gray-400">
                    <Loader2 size={18} className="animate-spin mr-2" /> Chargement…
                  </div>
                ) : referrals.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-12 text-center">
                    <UserPlus size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">Aucun parrainage enregistré pour le moment.</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Parrain</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Progression</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Filleuls</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Code</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {referrals.map((r) => {
                          const count = r.referral_count;
                          const done  = count >= 3;
                          return (
                            <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                              {/* Parrain */}
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                                    <span className="text-blue-700 dark:text-blue-300 text-xs font-bold">
                                      {(r.first_name?.[0] ?? "").toUpperCase()}{(r.last_name?.[0] ?? "").toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">{r.first_name} {r.last_name}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{r.email}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Jauge */}
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    {[0, 1, 2].map((i) => (
                                      <div
                                        key={i}
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                          i < count
                                            ? "bg-blue-600 border-blue-600"
                                            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                        }`}
                                      >
                                        {i < count && <Check size={10} className="text-white" />}
                                      </div>
                                    ))}
                                  </div>
                                  <span className={`text-xs font-semibold tabular-nums ${done ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}>
                                    {count}/3
                                  </span>
                                  {done && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                      ✓ Récompense
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Filleuls */}
                              <td className="px-5 py-4">
                                <div className="space-y-0.5">
                                  {r.invited.map((inv, i) => (
                                    <p key={i} className="text-xs text-gray-600 dark:text-gray-400">
                                      {inv.first_name} —{" "}
                                      <span className="text-gray-400 dark:text-gray-500">
                                        {new Date(inv.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                      </span>
                                    </p>
                                  ))}
                                </div>
                              </td>

                              {/* Code */}
                              <td className="px-5 py-4">
                                <span className="font-mono text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                  {r.referral_code ?? "—"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </main>
        </div>
      </div>

      {/* ─── User activity panel ──────────────────────────────────────── */}
      {selectedUser && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => closeUserActivity()}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-50 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold">
                    {((selectedUser.first_name?.[0] ?? "") + (selectedUser.last_name?.[0] ?? "")).toUpperCase() || "?"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => closeUserActivity()}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedUser.totalUsage}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">requêtes IA</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedUser.totalMiniGames}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">mini-jeux</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedUser.sessions}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">sessions</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {activityLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 size={18} className="animate-spin mr-2" /> Chargement…
                </div>
              ) : activityEvents.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
                  Aucune activité enregistrée.
                </div>
              ) : (
                <>
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">
                    Activité récente ({activityEvents.length} événements)
                  </p>
                  <div className="space-y-1">
                    {activityEvents.map((ev, i) => {
                      const isPage = ev.type === "page";
                      const isTool = ev.type === "tool";
                      const icon = isTool
                        ? <MessageCircle size={13} className="text-blue-500 dark:text-blue-400" />
                        : isPage
                        ? <MousePointerClick size={13} className="text-gray-400 dark:text-gray-500" />
                        : <Gamepad2 size={13} className="text-violet-500 dark:text-violet-400" />;

                      const labelCls = isTool
                        ? "text-gray-800 dark:text-gray-200"
                        : isPage
                        ? "text-gray-400 dark:text-gray-500 font-mono text-[11px]"
                        : "text-gray-800 dark:text-gray-200";

                      return (
                        <div key={i} className="flex items-start gap-2.5 py-2 border-b border-gray-50 dark:border-gray-800/60 last:border-0">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-gray-50 dark:bg-gray-800">
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs truncate ${labelCls}`}>{ev.label}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">
                              {new Date(ev.created_at).toLocaleDateString("fr-FR", {
                                day: "2-digit", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── Détail d'un envoi email ──────────────────────────────────── */}
      {selectedBroadcastId && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => closeBroadcastDetail()}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-50 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {broadcastDetail?.broadcast.subject ?? "Chargement…"}
                </p>
                {broadcastDetail && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                    {new Date(broadcastDetail.broadcast.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" · "}{broadcastDetail.broadcast.target_label}
                  </p>
                )}
              </div>
              <button
                onClick={() => closeBroadcastDetail()}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {broadcastDetailLoading || !broadcastDetail ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <Loader2 size={18} className="animate-spin mr-2" /> Chargement…
              </div>
            ) : (
              <>
                {/* Stats summary */}
                <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{broadcastDetail.broadcast.sent_count}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">envoyés</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{broadcastDetail.recipients.filter(r => r.opened_at).length}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">ont ouvert</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{broadcastDetail.recipients.filter(r => r.clicked_at).length}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">ont cliqué</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {/* Contenu envoyé */}
                  <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Contenu envoyé</p>
                    <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                      {broadcastDetail.broadcast.blocks.map((block) => <EmailBlockPreview key={block.id} block={block} />)}
                    </div>
                  </div>

                  {/* Détail des destinataires */}
                  <div className="px-6 py-5">
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
                      Destinataires ({broadcastDetail.recipients.length})
                    </p>
                    {broadcastDetail.recipients.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Détail indisponible — cet envoi date d&apos;avant l&apos;activation du suivi par destinataire, ou la migration SQL n&apos;a pas encore été appliquée.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {broadcastDetail.recipients.map((r) => (
                          <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800/60 last:border-0">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{r.first_name || r.email}</p>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{r.email}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className={`inline-flex items-center gap-1 text-[11px] ${r.opened_at ? "text-emerald-600 dark:text-emerald-400" : "text-gray-300 dark:text-gray-600"}`} title={r.opened_at ? new Date(r.opened_at).toLocaleString("fr-FR") : "Pas ouvert"}>
                                <Eye size={11} /> {r.open_count}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-[11px] ${r.clicked_at ? "text-blue-600 dark:text-blue-400" : "text-gray-300 dark:text-gray-600"}`} title={r.clicked_at ? new Date(r.clicked_at).toLocaleString("fr-FR") : "Pas cliqué"}>
                                <MousePointerClick size={11} /> {r.click_count}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminPageInner />
    </Suspense>
  );
}
