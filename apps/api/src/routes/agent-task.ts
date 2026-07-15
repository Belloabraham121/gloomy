import { Router } from "express";
import {
  encodeLang,
  normalizeUiStyle,
  summarizeLangComponents,
  type UiStyleId,
} from "@gloomy/a2ui-spec";
import { getCachedResponse, setCachedResponse } from "../cache/cache.js";
import {
  getLlmProvider,
  LangGenerationError,
  MissingApiKeyError,
} from "../llm/index.js";
import { createLogger } from "../log.js";
import { recordProgress } from "../progress/progress.js";
import { buildGroundingContext } from "../rag/grounding.js";

const log = createLogger("api:agent-task");

/**
 * POST /api/agent/task - the marketplace fulfillment endpoint. After a task
 * reaches job_accepted, the ASP operator session calls this once with the
 * job description; the response carries a self-contained view URL and a
 * ready-to-paste message for `onchainos agent deliver`. Reuses the exact
 * cache -> grounding -> generation machinery of /api/chat.
 */
export const agentTaskRouter = Router();

interface AgentTaskBody {
  task?: string;
  jobId?: string;
  documentId?: string;
  style?: UiStyleId | string;
}

/** Builds the stateless deliverable link + deliver-ready message. Exported for tests. */
export function buildDeliverable(
  lang: string,
  webUrl: string | undefined,
): { viewUrl: string; deliverMessage: string } {
  const path = `/d?p=${encodeLang(lang)}`;
  const viewUrl = webUrl ? `${webUrl.replace(/\/+$/, "")}${path}` : path;
  const deliverMessage = `Task completed - gloomy generated an interactive UI (${summarizeLangComponents(lang)}) answering the request. Open it here: ${viewUrl}`;
  return { viewUrl, deliverMessage };
}

/** True when the request may proceed. Exported for tests. */
export function isAuthorized(
  configuredKey: string | undefined,
  headerKey: string | undefined,
): boolean {
  if (!configuredKey) return true;
  return headerKey === configuredKey;
}

agentTaskRouter.post("/", async (req, res) => {
  if (!isAuthorized(process.env.AGENT_TASK_KEY, req.get("x-agent-key"))) {
    res.status(401).json({ error: "Missing or invalid x-agent-key header" });
    return;
  }

  const body = req.body as AgentTaskBody;
  const task = body.task?.trim();
  if (!task) {
    res.status(400).json({ error: "task (the job description) is required" });
    return;
  }

  const webUrl = process.env.PUBLIC_WEB_URL;
  const style = normalizeUiStyle(body.style);

  const respond = (lang: string, cached: boolean, provider?: string) => {
    const { viewUrl, deliverMessage } = buildDeliverable(lang, webUrl);
    res.json({
      jobId: body.jobId ?? undefined,
      cached,
      provider,
      style,
      lang,
      viewUrl,
      deliverMessage,
      ...(webUrl
        ? {}
        : {
            note: "PUBLIC_WEB_URL is not set - viewUrl is a relative path; prefix it with the deployed apps/web origin.",
          }),
    });
  };

  const cachedLang = await getCachedResponse(task, body.documentId, style);
  if (cachedLang) {
    await recordProgress({ question: task, components: summarizeLangComponents(cachedLang) });
    respond(cachedLang, true);
    return;
  }

  let provider;
  try {
    provider = getLlmProvider();
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      res.status(501).json({ error: err.message });
      return;
    }
    throw err;
  }

  try {
    const groundingContext = await buildGroundingContext(body.documentId, task);
    const lang = await provider.runLangTurn([{ role: "user", content: task }], {
      groundingContext: groundingContext ?? undefined,
      style,
    });
    await setCachedResponse(task, lang, body.documentId, style);
    await recordProgress({ question: task, components: summarizeLangComponents(lang) });
    respond(lang, false, provider.name);
  } catch (err) {
    if (err instanceof LangGenerationError) {
      res.status(502).json({ error: err.message });
      return;
    }
    log.errorWith("agent task route failed", err);
    res.status(500).json({ error: "Internal error fulfilling task" });
  }
});
