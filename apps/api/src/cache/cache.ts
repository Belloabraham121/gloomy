import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { normalizeUiStyle, type UiStyleId } from "@gloomy/a2ui-spec";
import { getDb } from "../db/client.js";
import { cacheEntries } from "../db/schema.js";
import { createLogger } from "../log.js";

const log = createLogger("api:cache");

/**
 * Cache key hashes the normalized question together with the grounding
 * document and UI style (if any), so the same question as a "report"
 * doesn't wrongly hit a "lesson" answer, and grounding stays scoped.
 */
export function cacheKeyFor(
  question: string,
  documentId?: string,
  style?: UiStyleId | string,
): string {
  const normalized = question.trim().toLowerCase();
  const styleKey = normalizeUiStyle(style);
  return createHash("sha256")
    .update(`${documentId ?? ""}::${styleKey}::${normalized}`)
    .digest("hex");
}

/**
 * Best-effort read: a missing/unreachable database is treated as a cache
 * miss (returns null), never a thrown error. A configured-but-down Postgres
 * must not take out the chat endpoint on a public deploy. Returns the
 * cached OpenUI Lang program (see docs/openui-migration.md).
 */
export async function getCachedResponse(
  question: string,
  documentId?: string,
  style?: UiStyleId | string,
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const key = cacheKeyFor(question, documentId, style);
    const rows = await db
      .select()
      .from(cacheEntries)
      .where(eq(cacheEntries.cacheKey, key))
      .limit(1);

    return rows[0]?.lang ?? null;
  } catch (err) {
    log.errorWith("getCachedResponse failed (treating as miss)", err);
    return null;
  }
}

/**
 * Best-effort write: a failed cache write is logged and swallowed - caching
 * is an optimization, never a hard dependency of the response.
 */
export async function setCachedResponse(
  question: string,
  lang: string,
  documentId?: string,
  style?: UiStyleId | string,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    const key = cacheKeyFor(question, documentId, style);
    await db
      .insert(cacheEntries)
      .values({ cacheKey: key, lang })
      .onConflictDoUpdate({
        target: cacheEntries.cacheKey,
        set: { lang },
      });
  } catch (err) {
    log.errorWith("setCachedResponse failed (ignored)", err);
  }
}
