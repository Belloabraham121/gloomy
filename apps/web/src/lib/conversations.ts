import type { ChatResponse } from "@/lib/api";

/**
 * localStorage-backed conversation history for the chat sidebar. No auth /
 * no server store yet (see root README's session-vs-account note) - this is
 * purely a client-side convenience so a refresh doesn't lose the thread.
 */

export interface StoredEntry {
  id: string;
  question: string;
  status: "loading" | "success" | "error";
  response?: ChatResponse;
  errorStatus?: number;
  errorMessage?: string;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
  entries: StoredEntry[];
}

const STORAGE_KEY = "gloomy.conversations";

function readAll(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(conversations: Conversation[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

function titleFrom(entries: StoredEntry[]): string {
  const first = entries[0]?.question ?? "New chat";
  return first.length > 40 ? `${first.slice(0, 38)}…` : first;
}

/** Newest first. Only conversations that actually have a message. */
export function listConversations(): Conversation[] {
  return readAll()
    .filter((c) => c.entries.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadConversation(id: string): Conversation | null {
  return readAll().find((c) => c.id === id) ?? null;
}

/** Upserts. Persists nothing for an empty (unstarted) conversation. */
export function saveConversation(id: string, entries: StoredEntry[]): void {
  if (entries.length === 0) return;
  const all = readAll();
  const idx = all.findIndex((c) => c.id === id);
  const conversation: Conversation = {
    id,
    title: titleFrom(entries),
    updatedAt: Date.now(),
    entries,
  };
  if (idx >= 0) all[idx] = conversation;
  else all.push(conversation);
  writeAll(all);
}

export function deleteConversation(id: string): void {
  writeAll(readAll().filter((c) => c.id !== id));
}

export function newConversationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
