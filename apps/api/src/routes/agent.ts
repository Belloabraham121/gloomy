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
      "A generative UI agent: ask for a report, pitch deck, dashboard, lesson, form, or any interactive document (optionally grounded on an uploaded PDF/CSV) and get back a rich multi-block OpenUI Lang program — layouts, charts, tables, markdown, forms, follow-ups, real LaTeX, and gloomy's teaching components — instead of a wall of text.",
    version: VERSION,
    // The service type: a plain HTTPS API (OKX ASP calls this "A2MCP").
    serviceType: "api",
    uiTransport: "openui-lang",
    uiStyles: ["auto", "report", "pitch", "dashboard", "lesson", "form"],
    endpoints: {
      chat: {
        method: "POST",
        path: "/api/chat",
        url: `${baseUrl}/api/chat`,
        description:
          "Send { messages: [{ role, content }], sessionId?, documentId?, style?, stream? }; receive { lang, viewUrl, provider?, cached, style } — or SSE (Accept: text/event-stream / stream:true) with delta+done events. `lang` is an OpenUI Lang program.",
      },
      task: {
        method: "POST",
        path: "/api/agent/task",
        url: `${baseUrl}/api/agent/task`,
        description:
          "Marketplace fulfillment: send { task, jobId?, documentId?, style? } after job_accepted; receive { lang, viewUrl, deliverMessage, style } — deliverMessage is ready for `onchainos agent deliver --message`.",
      },
      documents: {
        method: "POST",
        path: "/api/documents",
        url: `${baseUrl}/api/documents`,
        description:
          "Upload a PDF (multipart field 'file') to ground subsequent questions in it. Returns { sourceId, title, chunkCount }.",
      },
      imageUploads: {
        method: "POST",
        path: "/api/uploads/images",
        url: `${baseUrl}/api/uploads/images`,
        description:
          "Upload a JPEG/PNG/WebP/GIF (multipart field 'file') for ImageUpload. Returns { id, url, contentType, bytes }; bytes are also served at GET /uploads/:filename.",
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
