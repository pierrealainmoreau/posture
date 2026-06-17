"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Info, CheckCircle2, AlertTriangle, Sparkles, X, Circle, CircleCheck } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: "info" | "success" | "warning" | "new_feature";
  href: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_META: Record<Notification["type"], { icon: React.ReactNode; cls: string; dot: string }> = {
  info:        { icon: <Info size={14} />,          cls: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",        dot: "bg-blue-500" },
  success:     { icon: <CheckCircle2 size={14} />,  cls: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40",    dot: "bg-green-500" },
  warning:     { icon: <AlertTriangle size={14} />, cls: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",    dot: "bg-amber-500" },
  new_feature: { icon: <Sparkles size={14} />,      cls: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40", dot: "bg-purple-500" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `Il y a ${days} j`;
}

export function NotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function updateCoords() {
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords({ left: rect.left, top: rect.bottom + 8 });
    }
    updateCoords();
    window.addEventListener("resize", updateCoords);
    return () => window.removeEventListener("resize", updateCoords);
  }, [open]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  }

  async function toggleRead(n: Notification) {
    const nextRead = !n.is_read;
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: nextRead } : x));
    setUnreadCount((c) => Math.max(0, c + (nextRead ? -1 : 1)));
    await fetch(`/api/notifications/${n.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: nextRead }),
    });
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications/read-all", { method: "POST" });
  }

  async function handleClick(n: Notification) {
    if (!n.is_read) await markRead(n.id);
    setOpen(false);
    if (n.href) router.push(n.href);
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            key={unreadCount}
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-[3px] rounded-full bg-red-500 text-white text-[10px] font-bold leading-none ring-2 ring-white dark:ring-gray-950 animate-in zoom-in-50 fade-in duration-200"
          >
            <span className="scale-90">{unreadCount > 9 ? "9+" : unreadCount}</span>
          </span>
        )}
      </button>

      {open && (
        <div
          style={{ left: coords.left, top: coords.top, right: "1rem" }}
          className="fixed z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-1"
                >
                  Tout marquer lu
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-600 gap-2">
                <Bell size={24} />
                <span className="text-sm">Aucune notification</span>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.info;
                return (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleClick(n)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick(n); }}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 ${
                      !n.is_read ? "bg-blue-50/40 dark:bg-blue-950/10" : ""
                    }`}
                  >
                    <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.cls}`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 whitespace-pre-wrap break-words">{n.body}</p>
                      )}
                      {n.href && (
                        <span className="inline-block mt-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 underline underline-offset-2">
                          Découvrir →
                        </span>
                      )}
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleRead(n); }}
                      title={n.is_read ? "Marquer comme non lu" : "Marquer comme lu"}
                      className="mt-0.5 w-6 h-6 flex items-center justify-center rounded-md flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {n.is_read ? <Circle size={14} /> : <CircleCheck size={14} className="text-blue-500" />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
