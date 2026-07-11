import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import type { A2uiPayload } from "@gloomy/a2ui-spec";
import { getDb } from "../db/client.js";
import { cacheEntries } from "../db/schema.js";

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

export async function getCachedResponse(
  question: string,
  documentId?: string,
): Promise<A2uiPayload | null> {
  const db = getDb();
  if (!db) return null;

  const key = cacheKeyFor(question, documentId);
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
  documentId?: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  const key = cacheKeyFor(question, documentId);
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
