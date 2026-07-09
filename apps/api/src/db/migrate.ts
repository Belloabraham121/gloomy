import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Cannot run migrations.");
  process.exit(1);
}

const migrationClient = postgres(url, { max: 1 });
const db = drizzle(migrationClient);

await migrate(db, { migrationsFolder: "./src/db/migrations" });
console.log("Migrations applied.");
await migrationClient.end();
