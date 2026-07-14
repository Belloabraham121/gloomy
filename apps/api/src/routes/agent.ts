import { Router } from "express";
import { customComponentSpecs } from "@gloomy/a2ui-spec";
import { OPENUI_COMPONENT_NAMES } from "../llm/generated/openui-contract.js";

/**
 * Machine-readable agent descriptor, served at both `/.well-known/agent.json`
 * (the emerging agent-discovery convention) and `/agent`. Lets a marketplace
 * or peer agent discover what gloomy is and what it can produce without
 * hard-coding anything. Purely public read metadata - no secrets.
 */
export const agentRouter = Router();

const VERSION = process.env.npm_package_version ?? "0.0.1";

function buildManifest(baseUrl: string) {
  const customDescriptions = Object.fromEntries(
    customComponentSpecs.map((c) => [c.name, c.description]),
  );
  const capabilities = OPENUI_COMPONENT_NAMES.map((name) => ({
    component: name,
    description: customDescriptions[name] ?? undefined,
  }));

  return {
    name: "gloomy",
    displayName: "gloomy",
    description:
      "A generative learning agent: ask a question (or upload a PDF/CSV) and get back a rich, multi-block interactive UI - layouts, charts, tables, markdown, real LaTeX, and gloomy's own teaching components (diagrams, step-throughs, quizzes, simulations) composed together via OpenUI Lang - instead of a wall of text.",
    version: VERSION,
    // The service type: a plain HTTPS API (OKX ASP calls this "A2MCP").
    serviceType: "api",
    uiTransport: "openui-lang",
    endpoints: {
      chat: {
        method: "POST",
        path: "/api/chat",
        url: `${baseUrl}/api/chat`,
        description:
          "Send { messages: [{ role, content }], sessionId?, documentId? }; receive { lang, viewUrl, provider?, cached } - `lang` is an OpenUI Lang program (render with @openuidev/react-lang's Renderer), `viewUrl` is a ready-to-open link for callers with no OpenUI renderer.",
      },
      task: {
        method: "POST",
        path: "/api/agent/task",
        url: `${baseUrl}/api/agent/task`,
        description:
          "Marketplace fulfillment: send { task, jobId?, documentId? } after job_accepted; receive { lang, viewUrl, deliverMessage } - deliverMessage is ready for `onchainos agent deliver --message`, viewUrl renders the full multi-block UI for the buyer.",
      },
      documents: {
        method: "POST",
        path: "/api/documents",
        url: `${baseUrl}/api/documents`,
        description:
          "Upload a PDF (multipart field 'file') to ground subsequent questions in it. Returns { sourceId, title, chunkCount }.",
      },
      health: {
        method: "GET",
        path: "/health",
        url: `${baseUrl}/health`,
      },
    },
    capabilities,
    homepage: process.env.PUBLIC_WEB_URL ?? undefined,
  };
}

function resolveBaseUrl(req: {
  protocol: string;
  get: (h: string) => string | undefined;
}): string {
  // Honor a configured public URL first (set PUBLIC_API_URL on the deploy);
  // fall back to the request's own host so it's correct in any environment.
  if (process.env.PUBLIC_API_URL) {
    return process.env.PUBLIC_API_URL.replace(/\/+$/, "");
  }
  const forwardedProto = req.get("x-forwarded-proto");
  const proto = forwardedProto?.split(",")[0]?.trim() || req.protocol;
  const host = req.get("host") ?? "localhost";
  return `${proto}://${host}`;
}

function handler(
  req: { protocol: string; get: (h: string) => string | undefined },
  res: { json: (body: unknown) => void },
) {
  res.json(buildManifest(resolveBaseUrl(req)));
}

agentRouter.get("/.well-known/agent.json", handler);
agentRouter.get("/agent", handler);
