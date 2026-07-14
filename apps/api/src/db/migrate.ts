import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { createLogger } from "../log.js";

const log = createLogger("api:migrate");

const url = process.env.DATABASE_URL;
if (!url) {
  log.error("DATABASE_URL is not set. Cannot run migrations.");
  process.exit(1);
}

const migrationClient = postgres(url, { max: 1 });
const db = drizzle(migrationClient);

await migrate(db, { migrationsFolder: "./src/db/migrations" });
log.info("Migrations applied.");
await migrationClient.end();
