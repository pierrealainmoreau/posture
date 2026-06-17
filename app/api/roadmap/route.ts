import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { dispatchNotificationTrigger } from "@/lib/notifications/dispatch";

async function getAuthedAdmin() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "admin") return null;
    return { user, supabase };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const [itemsRes, likesRes, userRes] = await Promise.all([
      supabase
        .from("roadmap_items")
        .select("id, phase, title, description, tag, sort_order, updated_at")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase.from("roadmap_likes").select("item_id, user_id"),
      supabase.auth.getUser(),
    ]);

    if (itemsRes.error) return NextResponse.json({ error: itemsRes.error.message }, { status: 500 });

    const userId = userRes.data.user?.id ?? null;
    const likes = likesRes.data ?? [];

    const countByItem: Record<string, number> = {};
    const userLikedSet = new Set<string>();
    for (const l of likes) {
      countByItem[l.item_id] = (countByItem[l.item_id] ?? 0) + 1;
      if (userId && l.user_id === userId) userLikedSet.add(l.item_id);
    }

    const result = (itemsRes.data ?? []).map(item => ({
      ...item,
      likes_count: countByItem[item.id] ?? 0,
      user_liked: userLikedSet.has(item.id),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authed = await getAuthedAdmin();
    if (!authed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const body = await req.json() as { phase?: string; title?: string; description?: string; tag?: string; sort_order?: number };
    const { phase, title, description = "", tag = null, sort_order = 0 } = body;

    if (!phase || !["now", "next", "later", "released"].includes(phase)) {
      return NextResponse.json({ error: "Phase invalide" }, { status: 400 });
    }
    if (!title?.trim()) {
      return NextResponse.json({ error: "Titre requis" }, { status: 400 });
    }

    const { data, error } = await authed.supabase
      .from("roadmap_items")
      .insert({ phase, title: title.trim(), description, tag: tag || null, sort_order })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authed = await getAuthedAdmin();
    if (!authed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const body = await req.json() as { id?: string; title?: string; description?: string; tag?: string; sort_order?: number; phase?: string };
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) patch.title = updates.title.trim();
    if (updates.description !== undefined) patch.description = updates.description;
    if ("tag" in updates) patch.tag = updates.tag || null;
    if (updates.sort_order !== undefined) patch.sort_order = updates.sort_order;
    if (updates.phase !== undefined) patch.phase = updates.phase;

    let previousPhase: string | null = null;
    if (updates.phase !== undefined) {
      const { data: existing } = await authed.supabase.from("roadmap_items").select("phase").eq("id", id).single();
      previousPhase = existing?.phase ?? null;
    }

    const { data, error } = await authed.supabase
      .from("roadmap_items")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (updates.phase === "now" && previousPhase !== "now") {
      await dispatchNotificationTrigger("roadmap_item_shipped", { broadcast: true });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authed = await getAuthedAdmin();
    if (!authed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const body = await req.json() as { id?: string };
    if (!body.id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const { error } = await authed.supabase
      .from("roadmap_items")
      .delete()
      .eq("id", body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
