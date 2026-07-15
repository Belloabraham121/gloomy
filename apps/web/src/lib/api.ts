import type { UiStyleId } from "@gloomy/a2ui-spec";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * `/api/chat`'s response contract (see docs/openui-migration.md): an
 * OpenUI Lang program plus a `viewUrl` so non-web (e.g. OKX A2MCP) callers
 * get a renderable link too, not just raw Lang text.
 */
export interface ChatResponse {
  threadId: string;
  sessionId?: string;
  cached: boolean;
  provider?: "anthropic" | "openai";
  style?: UiStyleId;
  lang: string;
  viewUrl: string;
}

export class ChatApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ChatApiError";
  }
}

export interface AskQuestionOptions {
  sessionId?: string | null;
  documentId?: string;
  style?: UiStyleId;
  /**
   * Receive progressive openui-lang as the model streams. When provided,
   * the request uses SSE (`stream: true`). Final ChatResponse is still
   * returned when the `done` event arrives.
   */
  onDelta?: (partialLang: string) => void;
}

/**
 * `messages` is the full accumulated thread (see `lib/chat-history.ts`),
 * not just the latest question.
 */
export async function askQuestion(
  messages: ChatMessage[],
  sessionIdOrOpts?: string | null | AskQuestionOptions,
  documentId?: string,
): Promise<ChatResponse> {
  const opts: AskQuestionOptions =
    sessionIdOrOpts && typeof sessionIdOrOpts === "object"
      ? sessionIdOrOpts
      : { sessionId: sessionIdOrOpts as string | null | undefined, documentId };

  if (opts.onDelta) {
    return askQuestionStream(messages, opts);
  }

  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      threadId: "web-chat",
      sessionId: opts.sessionId ?? undefined,
      documentId: opts.documentId,
      style: opts.style ?? "auto",
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

async function askQuestionStream(
  messages: ChatMessage[],
  opts: AskQuestionOptions,
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      threadId: "web-chat",
      sessionId: opts.sessionId ?? undefined,
      documentId: opts.documentId,
      style: opts.style ?? "auto",
      stream: true,
      messages,
    }),
  });

  if (!res.ok) {
    let message = `apps/api responded with ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new ChatApiError(res.status, message);
  }

  if (!res.body) {
    throw new ChatApiError(502, "Streaming response had no body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const state: {
    donePayload?: ChatResponse;
    streamError?: string;
  } = {};

  const flushEvents = (chunk: string) => {
    buffer += chunk;
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const lines = part.split("\n");
      let event = "message";
      const dataLines: string[] = [];
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      }
      if (dataLines.length === 0) continue;
      let data: unknown;
      try {
        data = JSON.parse(dataLines.join("\n"));
      } catch {
        continue;
      }
      if (event === "delta" && data && typeof data === "object" && "lang" in data) {
        opts.onDelta?.(String((data as { lang: unknown }).lang));
      } else if (event === "done") {
        state.donePayload = data as ChatResponse;
      } else if (event === "error" && data && typeof data === "object" && "error" in data) {
        state.streamError = String((data as { error: unknown }).error);
      }
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    flushEvents(decoder.decode(value, { stream: true }));
  }
  flushEvents(decoder.decode());

  if (state.streamError) {
    throw new ChatApiError(502, state.streamError);
  }
  if (!state.donePayload?.lang) {
    throw new ChatApiError(502, "Stream ended without a done event");
  }
  return state.donePayload;
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

export interface ImageUploadResponse {
  id: string;
  /** Prefer absolute API URL so <img> works from apps/web on another origin. */
  url: string;
  contentType: string;
  bytes: number;
}

/** Uploads a real image for ImageUpload / ImageBlock follow-ups. */
export async function uploadImage(file: File): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/uploads/images`, {
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

  const raw = body as ImageUploadResponse;
  const url =
    raw.url?.startsWith("http://") || raw.url?.startsWith("https://")
      ? raw.url
      : `${API_URL.replace(/\/+$/, "")}${raw.url?.startsWith("/") ? "" : "/"}${raw.url ?? ""}`;

  return { ...raw, url };
}
