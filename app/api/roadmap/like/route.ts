import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { item_id } = await req.json() as { item_id?: string };
    if (!item_id) return NextResponse.json({ error: "item_id requis" }, { status: 400 });

    const { data: existing } = await supabase
      .from("roadmap_likes")
      .select("id")
      .eq("item_id", item_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("roadmap_likes").delete().eq("id", existing.id);
    } else {
      const { error: insertErr } = await supabase.from("roadmap_likes")
        .insert({ item_id, user_id: user.id });
      if (insertErr && insertErr.code !== "23505") {
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
      }
    }

    const { count } = await supabase
      .from("roadmap_likes")
      .select("*", { count: "exact", head: true })
      .eq("item_id", item_id);

    return NextResponse.json({ liked: !existing, count: count ?? 0 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
