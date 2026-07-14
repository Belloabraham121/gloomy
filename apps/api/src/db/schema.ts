import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

/**
 * Generated-response cache. Keyed on a hash of the question plus whatever
 * source material was used, so a repeat question skips the LLM entirely.
 * `lang` is an OpenUI Lang program (see docs/openui-migration.md) - before
 * the OpenUI migration this table stored `component` (text) + `props`
 * (jsonb) instead; that shape is gone, cache rows from before the
 * migration are simply not readable anymore (cache is fully regenerable,
 * never user data, so this is a deliberate non-backward-compatible
 * migration - see the accompanying drizzle migration).
 */
export const cacheEntries = pgTable("cache_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  cacheKey: text("cache_key").notNull().unique(),
  lang: text("lang").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * A session is deliberately not a user account (see README discussion on
 * auth) - just an anonymous id a client generates and keeps in
 * localStorage/a cookie, used to group progress rows.
 */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const progressEntries = pgTable(
  "progress_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    // Since a single response is now a whole Lang program (not one
    // component), this holds a short comma-joined summary of the distinct
    // component types used (e.g. "Stack, Chart, Table"), not one name.
    components: text("components").notNull(),
    quizCorrect: boolean("quiz_correct"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("progress_entries_session_id_idx").on(table.sessionId)],
);

/**
 * RAG tables (build order step 4). Embedding dimension matches
 * OpenAI/Voyage-class 1536-dim models; revisit if step 4 picks a different
 * embedding model.
 *
 * sessionId scopes a document to the canvas that uploaded it (nullable -
 * ingestion can run before a session exists yet, same as progress_entries).
 * status tracks ingestion so the frontend can show upload progress.
 */
export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  url: text("url"),
  sessionId: uuid("session_id").references(() => sessions.id, {
    onDelete: "cascade",
  }),
  status: text("status").notNull().default("ready"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);

export const enableVectorExtension = sql`CREATE EXTENSION IF NOT EXISTS vector`;
