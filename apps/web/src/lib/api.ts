const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface ChatStubResponse {
  threadId: string;
  reply: string;
}

export async function pingChat(message: string): Promise<ChatStubResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      threadId: "web-smoke-test",
      messages: [{ role: "user", content: message }],
    }),
  });

  if (!res.ok) {
    throw new Error(`apps/api responded with ${res.status}`);
  }

  return res.json();
}
