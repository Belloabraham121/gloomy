import type { ErrorRequestHandler } from "express";
import { Router } from "express";
import multer from "multer";
import { MissingApiKeyError } from "../llm/shared.js";
import { EmptyDocumentError, ingestPdf, MissingDatabaseError } from "../rag/ingest.js";

export const documentsRouter = Router();

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF uploads are supported right now"));
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
    const result = await ingestPdf(file.buffer, title, body.sessionId);
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
    console.error("document ingest failed:", err);
    res.status(500).json({ error: "Internal error ingesting document" });
  }
});

const handleUploadError: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes("PDF")) {
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
};

documentsRouter.use(handleUploadError);
