import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { cacheEntries } from "../db/schema.js";
import { createLogger } from "../log.js";

const log = createLogger("api:cache");

/**
 * Cache key hashes the normalized question together with the grounding
 * document (if any), so the same question against a different (or no)
 * document doesn't wrongly hit another document's cached answer.
 */
export function cacheKeyFor(question: string, documentId?: string): string {
  const normalized = question.trim().toLowerCase();
  return createHash("sha256")
    .update(`${documentId ?? ""}::${normalized}`)
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
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const key = cacheKeyFor(question, documentId);
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
): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    const key = cacheKeyFor(question, documentId);
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
