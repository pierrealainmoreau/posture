import type { IcebreakerQuestion } from "@/lib/types";

type DbRow = { id: string; question: string; created_at: string };

function toQuestion(row: DbRow): IcebreakerQuestion {
  return { id: row.id, question: row.question, category: "anecdotes" };
}

export async function loadAnecdotes(): Promise<IcebreakerQuestion[]> {
  const res = await fetch("/api/anecdotes");
  if (!res.ok) return [];
  const data: DbRow[] = await res.json();
  return data.map(toQuestion);
}

export async function addAnecdote(question: string): Promise<IcebreakerQuestion | null> {
  const res = await fetch("/api/anecdotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) return null;
  const data: DbRow | null = await res.json();
  return data ? toQuestion(data) : null;
}

export async function updateAnecdote(id: string, question: string): Promise<boolean> {
  const res = await fetch("/api/anecdotes", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, question }),
  });
  return res.ok;
}

export async function deleteAnecdote(id: string): Promise<boolean> {
  const res = await fetch("/api/anecdotes", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  return res.ok;
}
