import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getAuthenticatedUser() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data } = await supabase
    .from("user_anecdotes")
    .select("id, question, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return NextResponse.json(null, { status: 401 });

  const { question } = await req.json();
  const { data } = await supabase
    .from("user_anecdotes")
    .insert({ user_id: user.id, question })
    .select("id, question, created_at")
    .single();

  return NextResponse.json(data ?? null);
}

export async function PATCH(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id, question } = await req.json();
  const { error } = await supabase
    .from("user_anecdotes")
    .update({ question })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: !error });
}

export async function DELETE(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await req.json();
  const { error } = await supabase
    .from("user_anecdotes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: !error });
}
