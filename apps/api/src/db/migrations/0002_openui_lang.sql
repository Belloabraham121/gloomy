-- cache_entries is a fully-regenerable response cache (never user data - see
-- db/schema.ts) so old {component, props} rows are simply discarded rather
-- than migrated to the new `lang` column; a truncated cache just means the
-- first repeat question after deploy is a miss instead of a hit.
TRUNCATE TABLE "cache_entries";--> statement-breakpoint
ALTER TABLE "cache_entries" ADD COLUMN "lang" text NOT NULL;--> statement-breakpoint
ALTER TABLE "cache_entries" DROP COLUMN "component";--> statement-breakpoint
ALTER TABLE "cache_entries" DROP COLUMN "props";--> statement-breakpoint
ALTER TABLE "progress_entries" RENAME COLUMN "component" TO "components";
