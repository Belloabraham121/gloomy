import type { A2uiPayload } from "@gloomy/a2ui-spec";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

export async function askQuestion(
  question: string,
  sessionId: string | null,
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      threadId: "web-chat",
      sessionId: sessionId ?? undefined,
      messages: [{ role: "user", content: question }],
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
