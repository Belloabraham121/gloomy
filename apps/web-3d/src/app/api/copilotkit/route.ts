import {
  AnthropicAdapter,
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import type { NextRequest } from "next/server";

/**
 * Same provider convention as apps/api: LLM_PROVIDER=anthropic|openai
 * forces one (failing loudly if its key is missing), otherwise Anthropic
 * is preferred when both keys are present.
 */
function pickServiceAdapter():
  | { ok: true; adapter: AnthropicAdapter | OpenAIAdapter }
  | { ok: false; error: string } {
  const forced = process.env.LLM_PROVIDER?.toLowerCase();
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

  if (forced && forced !== "anthropic" && forced !== "openai") {
    return {
      ok: false,
      error: `LLM_PROVIDER="${process.env.LLM_PROVIDER}" is not recognized. Use "anthropic" or "openai".`,
    };
  }
  if (forced === "anthropic" && !hasAnthropic) {
    return {
      ok: false,
      error:
        "LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set in apps/web-3d/.env.local.",
    };
  }
  if (forced === "openai" && !hasOpenAI) {
    return {
      ok: false,
      error:
        "LLM_PROVIDER=openai but OPENAI_API_KEY is not set in apps/web-3d/.env.local.",
    };
  }

  if (forced === "anthropic" || (!forced && hasAnthropic)) {
    return { ok: true, adapter: new AnthropicAdapter() };
  }
  if (forced === "openai" || (!forced && hasOpenAI)) {
    return { ok: true, adapter: new OpenAIAdapter() };
  }

  return {
    ok: false,
    error:
      "No LLM provider is configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in apps/web-3d/.env.local (see .env.local.example).",
  };
}

export const POST = async (req: NextRequest) => {
  const picked = pickServiceAdapter();
  if (!picked.ok) {
    return Response.json({ error: picked.error }, { status: 501 });
  }

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: new CopilotRuntime(),
    serviceAdapter: picked.adapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
