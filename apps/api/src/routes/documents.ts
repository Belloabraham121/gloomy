import type { ErrorRequestHandler } from "express";
import { Router } from "express";
import multer from "multer";
import { MissingApiKeyError } from "../llm/shared.js";
import { createLogger } from "../log.js";
import {
  EmptyDocumentError,
  ingestCsv,
  ingestPdf,
  MissingDatabaseError,
} from "../rag/ingest.js";

const log = createLogger("api:documents");

export const documentsRouter = Router();

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB

// Browsers/OSes send inconsistent CSV mimetypes (Chrome: text/csv, Excel
// exports: application/vnd.ms-excel, some send an empty/octet-stream type),
// so the filename extension is checked as a fallback rather than trusting
// mimetype alone.
function isCsv(file: { mimetype: string; originalname: string }): boolean {
  const csvMimetypes = new Set([
    "text/csv",
    "application/vnd.ms-excel",
    "application/csv",
  ]);
  return csvMimetypes.has(file.mimetype) || file.originalname.toLowerCase().endsWith(".csv");
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf" && !isCsv(file)) {
      cb(new Error("Only PDF or CSV uploads are supported right now"));
      return;
    }
    cb(null, true);
  },
});

interface DocumentUploadBody {
  sessionId?: string;
}

documentsRouter.post("/", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file uploaded (expected field name 'file')" });
    return;
  }

  const body = req.body as DocumentUploadBody;
  const title = req.body?.title || file.originalname || "Untitled document";

  try {
    const result = isCsv(file)
      ? await ingestCsv(file.buffer, title, body.sessionId)
      : await ingestPdf(file.buffer, title, body.sessionId);
    res.json(result);
  } catch (err) {
    if (err instanceof MissingApiKeyError || err instanceof MissingDatabaseError) {
      res.status(501).json({ error: err.message });
      return;
    }
    if (err instanceof EmptyDocumentError) {
      res.status(422).json({ error: err.message });
      return;
    }
    log.errorWith("document ingest failed", err);
    res.status(500).json({ error: "Internal error ingesting document" });
  }
});

const handleUploadError: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes("PDF or CSV")) {
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
};

documentsRouter.use(handleUploadError);
