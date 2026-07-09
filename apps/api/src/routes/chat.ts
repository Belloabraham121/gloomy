import { Router } from "express";

export const chatRouter = Router();

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  threadId?: string;
  messages?: ChatMessage[];
}

chatRouter.post("/", (req, res) => {
  const body = req.body as ChatRequestBody;
  const lastUserMessage = body.messages?.at(-1)?.content ?? "(no message)";

  res.json({
    threadId: body.threadId ?? "stub-thread",
    reply: `apps/api received: "${lastUserMessage}"`,
  });
});
