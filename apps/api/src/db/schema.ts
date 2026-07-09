import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

/**
 * Generated-component cache. Keyed on a hash of the question plus whatever
 * source material was used, so a repeat question skips Claude entirely.
 * See docs/architecture.md for the caching design note.
 */
export const cacheEntries = pgTable("cache_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  cacheKey: text("cache_key").notNull().unique(),
  component: text("component").notNull(),
  props: jsonb("props").notNull(),
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
    component: text("component").notNull(),
    quizCorrect: boolean("quiz_correct"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("progress_entries_session_id_idx").on(table.sessionId)],
);

/**
 * RAG tables (build order step 4) - schema only for now, no ingestion
 * pipeline yet. Embedding dimension matches OpenAI/Voyage-class
 * 1536-dim models; revisit if step 4 picks a different embedding model.
 */
export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  url: text("url"),
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
