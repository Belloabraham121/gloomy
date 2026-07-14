import cors from "cors";
import express from "express";
import { log, requestLogger } from "./log.js";
import { agentRouter } from "./routes/agent.js";
import { agentTaskRouter } from "./routes/agent-task.js";
import { chatRouter } from "./routes/chat.js";
import { documentsRouter } from "./routes/documents.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(requestLogger());
// Body-size guard: JSON chat payloads are small; cap them so a public
// endpoint can't be flooded with huge bodies. PDF uploads go through
// multer (documentsRouter) with its own 20MB limit, not this parser.
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "gloomy-api" });
});

app.use(agentRouter);
app.use("/api/chat", chatRouter);
app.use("/api/agent/task", agentTaskRouter);
app.use("/api/documents", documentsRouter);

const server = app.listen(port, () => {
  log.info("listening", {
    url: `http://localhost:${port}`,
    env: process.env.NODE_ENV ?? "development",
    logLevel: process.env.LOG_LEVEL ?? "debug",
  });
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    log.error("port already in use — stop the other process or set PORT", {
      port,
    });
  } else {
    log.errorWith("server listen failed", err, { port });
  }
  process.exit(1);
});

/**
 * Close the HTTP server before exit so `tsx watch` / nodemon-style restarts
 * don't race the next boot with EADDRINUSE on the same port.
 */
function shutdown(signal: string): void {
  log.info("shutting down", { signal });
  server.close((err) => {
    if (err) {
      log.errorWith("error during shutdown", err);
      process.exit(1);
    }
    process.exit(0);
  });
  // Hard stop if connections hang (open keep-alives, etc.).
  setTimeout(() => {
    log.warn("forced exit after shutdown timeout");
    process.exit(1);
  }, 5_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
