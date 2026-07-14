import { summarizeLangComponents } from "@gloomy/a2ui-spec";
import type { ChatMessage, ChatResponse } from "./api";
import type { StoredEntry } from "./conversations";

// Keeps the request small and within the API's own history cap
// (MAX_HISTORY_MESSAGES in apps/api/src/routes/chat.ts) - only the most
// recent turns are relevant to a follow-up like "now chart that" anyway.
const MAX_PRIOR_TURNS = 10;
const MAX_LABEL_LENGTH = 80;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Prior assistant turns are never replayed as their full openui-lang
 * program (that would balloon the request and isn't useful to the model
 * as conversation text) - instead each becomes a short bracketed note the
 * system prompt knows how to read, e.g. `[assistant generated Stack,
 * Chart, Table]`, so a follow-up can reference "it" meaningfully.
 */
function describeAssistantTurn(response: ChatResponse): string {
  const summary = summarizeLangComponents(response.lang);
  return `[assistant generated ${truncate(summary, MAX_LABEL_LENGTH)}]`;
}

/** Builds the full thread to send to /api/chat: capped prior turns
 * (question + a note standing in for whatever component was shown, when
 * one was) followed by the new question. */
export function buildThreadMessages(
  entries: StoredEntry[],
  newQuestion: string,
): ChatMessage[] {
  const priorTurns = entries.slice(-MAX_PRIOR_TURNS);
  const messages: ChatMessage[] = [];

  for (const entry of priorTurns) {
    if (!entry.question.trim()) continue;
    messages.push({ role: "user", content: entry.question });
    if (entry.status === "success" && entry.response) {
      messages.push({ role: "assistant", content: describeAssistantTurn(entry.response) });
    }
  }

  messages.push({ role: "user", content: newQuestion });
  return messages;
}
