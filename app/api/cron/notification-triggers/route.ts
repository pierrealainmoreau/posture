import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { dispatchNotificationTrigger, type TriggerEvent } from "@/lib/notifications/dispatch";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

async function hasActiveTemplate(admin: ReturnType<typeof createAdminSupabaseClient>, event: TriggerEvent) {
  const { data } = await admin
    .from("notification_templates")
    .select("id")
    .eq("trigger_event", event)
    .eq("is_active", true)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

// GET /api/cron/notification-triggers — appelé une fois par jour par Vercel Cron
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const admin = createAdminSupabaseClient();

    const [want7d, want30d, wantAnniversary] = await Promise.all([
      hasActiveTemplate(admin, "user_inactive_7d"),
      hasActiveTemplate(admin, "user_inactive_30d"),
      hasActiveTemplate(admin, "signup_anniversary"),
    ]);

    if (!want7d && !want30d && !wantAnniversary) {
      return NextResponse.json({ ok: true, skipped: "aucun template actif pour ces événements" });
    }

    const { data: profiles } = await admin.from("profiles").select("id, created_at");
    if (!profiles || profiles.length === 0) return NextResponse.json({ ok: true, processed: 0 });

    const lastSignInById: Record<string, string | null> = {};
    if (want7d || want30d) {
      let page = 1;
      const perPage = 1000;
      for (;;) {
        const { data } = await admin.auth.admin.listUsers({ page, perPage });
        const users = data?.users ?? [];
        for (const u of users) lastSignInById[u.id] = u.last_sign_in_at ?? null;
        if (users.length < perPage) break;
        page++;
      }
    }

    const now = new Date();
    const today = { month: now.getUTCMonth(), day: now.getUTCDate() };

    let notified7d = 0, notified30d = 0, notifiedAnniversary = 0;

    for (const profile of profiles) {
      if ((want7d || want30d) && lastSignInById[profile.id]) {
        const daysSince = Math.floor((now.getTime() - new Date(lastSignInById[profile.id]!).getTime()) / DAY_MS);
        if (want7d && daysSince === 7) {
          await dispatchNotificationTrigger("user_inactive_7d", { userId: profile.id });
          notified7d++;
        }
        if (want30d && daysSince === 30) {
          await dispatchNotificationTrigger("user_inactive_30d", { userId: profile.id });
          notified30d++;
        }
      }

      if (wantAnniversary && profile.created_at) {
        const created = new Date(profile.created_at);
        const isAnniversary =
          created.getUTCMonth() === today.month &&
          created.getUTCDate() === today.day &&
          now.getUTCFullYear() > created.getUTCFullYear();
        if (isAnniversary) {
          await dispatchNotificationTrigger("signup_anniversary", { userId: profile.id });
          notifiedAnniversary++;
        }
      }
    }

    return NextResponse.json({ ok: true, processed: profiles.length, notified7d, notified30d, notifiedAnniversary });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur serveur" }, { status: 500 });
  }
}
