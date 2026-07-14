import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createLogger } from "../log.js";
import * as schema from "./schema.js";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

const log = createLogger("api:db");

let cachedDb: Database | null = null;
let warnedOnce = false;

/**
 * Returns null (not a thrown error) when DATABASE_URL isn't set. Caching
 * and progress tracking are enhancements, not core functionality - the
 * chat route should keep working without a database, just without those
 * extras. Contrast with getClaudeClient(), which throws, because Claude is
 * not optional to the product.
 */
export function getDb(): Database | null {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (!warnedOnce) {
      log.warn(
        "DATABASE_URL is not set - caching and progress tracking are disabled.",
      );
      warnedOnce = true;
    }
    return null;
  }
  if (!cachedDb) {
    const client = postgres(url);
    cachedDb = drizzle(client, { schema });
  }
  return cachedDb;
}
