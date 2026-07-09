import cors from "cors";
import express from "express";
import { chatRouter } from "./routes/chat.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "gloomy-api" });
});

app.use("/api/chat", chatRouter);

app.listen(port, () => {
  console.log(`apps/api listening on http://localhost:${port}`);
});
