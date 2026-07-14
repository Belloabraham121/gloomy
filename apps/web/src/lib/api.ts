import type { A2uiPayload } from "@gloomy/a2ui-spec";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSuccessResponse {
  threadId: string;
  sessionId?: string;
  cached: boolean;
}

export type ChatResponse = ChatSuccessResponse & A2uiPayload;

export class ChatApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ChatApiError";
  }
}

/**
 * `messages` is the full accumulated thread (see `lib/chat-history.ts`),
 * not just the latest question - this is what lets follow-ups like "now
 * chart that" build on what was already asked/shown instead of the model
 * seeing a single message in isolation.
 */
export async function askQuestion(
  messages: ChatMessage[],
  sessionId: string | null,
  documentId?: string,
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      threadId: "web-chat",
      sessionId: sessionId ?? undefined,
      documentId,
      messages,
    }),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new ChatApiError(
      res.status,
      body.error ?? `apps/api responded with ${res.status}`,
    );
  }

  return body as ChatResponse;
}

export interface DocumentUploadResponse {
  sourceId: string;
  title: string;
  chunkCount: number;
}

export async function uploadDocument(
  file: File,
  sessionId: string | null,
): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", file.name);
  if (sessionId) formData.append("sessionId", sessionId);

  const res = await fetch(`${API_URL}/api/documents`, {
    method: "POST",
    body: formData,
  });

  const body = await res.json();

  if (!res.ok) {
    throw new ChatApiError(
      res.status,
      body.error ?? `apps/api responded with ${res.status}`,
    );
  }

  return body as DocumentUploadResponse;
}
