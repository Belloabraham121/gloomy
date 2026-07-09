import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { progressEntries, sessions } from "../db/schema.js";

export interface RecordProgressInput {
  sessionId?: string;
  question: string;
  component: string;
  quizCorrect?: boolean;
}

/**
 * Ensures a session row exists, creating one if sessionId is missing or
 * unknown. No auth in this pass (see README's session-vs-account
 * discussion) - the client just holds onto the returned id.
 */
async function ensureSession(
  db: NonNullable<ReturnType<typeof getDb>>,
  sessionId: string | undefined,
): Promise<string> {
  if (sessionId) {
    const existing = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);
    if (existing[0]) return existing[0].id;
  }

  const [created] = await db.insert(sessions).values({}).returning({
    id: sessions.id,
  });
  return created.id;
}

/**
 * Best-effort: returns null (and logs) instead of throwing if the database
 * isn't configured or the write fails, since progress tracking should
 * never take down the actual chat response.
 */
export async function recordProgress(
  input: RecordProgressInput,
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const sessionId = await ensureSession(db, input.sessionId);
    await db.insert(progressEntries).values({
      sessionId,
      question: input.question,
      component: input.component,
      quizCorrect: input.quizCorrect ?? null,
    });
    return sessionId;
  } catch (err) {
    console.error("recordProgress failed:", err);
    return null;
  }
}
