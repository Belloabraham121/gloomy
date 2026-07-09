import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { getCachedResponse, setCachedResponse } from "../cache/cache.js";
import { recordProgress } from "../progress/progress.js";
import { getDb } from "./client.js";
import { chunks, sources } from "./schema.js";

// These hit a real Postgres (with pgvector) rather than mocking the driver -
// schema/migration correctness and actual SQL behavior (upserts, FKs, vector
// similarity) can't be verified any other way. Skips cleanly if no
// DATABASE_URL is configured (e.g. CI without a Postgres service).
const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("database layer (live Postgres)", () => {
  const db = getDb();
  if (!db) throw new Error("expected getDb() to return a client when DATABASE_URL is set");

  afterAll(async () => {
    // postgres-js keeps the connection pool alive otherwise, which hangs vitest.
    await (db as unknown as { $client: { end: () => Promise<void> } }).$client.end();
  });

  it("cache miss returns null, then a set is retrievable, then a second set upserts instead of erroring", async () => {
    const question = `test question ${randomUUID()}`;

    expect(await getCachedResponse(question)).toBeNull();

    await setCachedResponse(question, {
      component: "Quiz",
      props: {
        question: "2 + 2?",
        choices: [{ id: "a", label: "4" }],
        correctChoiceId: "a",
        explanation: "Arithmetic.",
      },
    });

    const first = await getCachedResponse(question);
    expect(first?.component).toBe("Quiz");

    // Same key, different payload - must upsert, not throw a unique-constraint error.
    await setCachedResponse(question, {
      component: "StepThrough",
      props: { title: "Updated", steps: [{ heading: "h", body: "b" }] },
    });

    const second = await getCachedResponse(question);
    expect(second?.component).toBe("StepThrough");
  });

  it("recordProgress creates a session when none is given, and reuses it when the id is passed back", async () => {
    const sessionId = await recordProgress({
      question: "What is a quiz?",
      component: "Quiz",
    });
    expect(sessionId).toBeTruthy();

    const reused = await recordProgress({
      sessionId: sessionId!,
      question: "Follow-up question",
      component: "StepThrough",
    });
    expect(reused).toBe(sessionId);
  });

  it("stores and queries a vector embedding with pgvector cosine similarity", async () => {
    const [source] = await db!
      .insert(sources)
      .values({ title: "Test source", url: "https://example.com" })
      .returning({ id: sources.id });

    const embeddingA = Array.from({ length: 1536 }, () => 1);
    const embeddingB = Array.from({ length: 1536 }, (_, i) => (i === 0 ? -1 : 1));

    await db!.insert(chunks).values([
      { sourceId: source.id, content: "chunk A", embedding: embeddingA },
      { sourceId: source.id, content: "chunk B", embedding: embeddingB },
    ]);

    // Query with a vector identical to embeddingA - it should come back
    // first (cosine distance ~0), proving the vector column + HNSW index
    // round-trip real similarity search, not just store-and-fetch.
    const results = await db!
      .select({ content: chunks.content })
      .from(chunks)
      .where(eq(chunks.sourceId, source.id))
      .orderBy(sql`embedding <=> ${JSON.stringify(embeddingA)}`)
      .limit(1);

    expect(results[0]?.content).toBe("chunk A");
  });
});
