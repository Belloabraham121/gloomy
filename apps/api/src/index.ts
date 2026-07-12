import cors from "cors";
import express from "express";
import { agentRouter } from "./routes/agent.js";
import { agentTaskRouter } from "./routes/agent-task.js";
import { chatRouter } from "./routes/chat.js";
import { documentsRouter } from "./routes/documents.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
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

app.listen(port, () => {
  console.log(`apps/api listening on http://localhost:${port}`);
});
