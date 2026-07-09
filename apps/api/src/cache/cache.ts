import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import type { A2uiPayload } from "@gloomy/a2ui-spec";
import { getDb } from "../db/client.js";
import { cacheEntries } from "../db/schema.js";

/**
 * Cache key is just a hash of the normalized question for now. Once RAG
 * grounding (step 4) lands, the source-set version needs to be folded in
 * here too, since the same question against updated sources should miss
 * the cache rather than serve stale content.
 */
export function cacheKeyFor(question: string): string {
  const normalized = question.trim().toLowerCase();
  return createHash("sha256").update(normalized).digest("hex");
}

export async function getCachedResponse(
  question: string,
): Promise<A2uiPayload | null> {
  const db = getDb();
  if (!db) return null;

  const key = cacheKeyFor(question);
  const rows = await db
    .select()
    .from(cacheEntries)
    .where(eq(cacheEntries.cacheKey, key))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return { component: row.component, props: row.props } as A2uiPayload;
}

export async function setCachedResponse(
  question: string,
  payload: A2uiPayload,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  const key = cacheKeyFor(question);
  await db
    .insert(cacheEntries)
    .values({
      cacheKey: key,
      component: payload.component,
      props: payload.props,
    })
    .onConflictDoUpdate({
      target: cacheEntries.cacheKey,
      set: { component: payload.component, props: payload.props },
    });
}
