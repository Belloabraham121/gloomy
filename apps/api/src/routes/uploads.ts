import type { ErrorRequestHandler } from "express";
import { Router } from "express";
import multer from "multer";
import { createLogger } from "../log.js";
import {
  isAllowedImageMime,
  MAX_IMAGE_BYTES,
  publicImageUrl,
  storeImage,
} from "../uploads/store.js";

const log = createLogger("api:uploads");

export const uploadsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedImageMime(file.mimetype)) {
      cb(
        new Error(
          "Only JPEG, PNG, WebP, or GIF image uploads are supported",
        ),
      );
      return;
    }
    cb(null, true);
  },
});

function resolveBaseUrl(req: {
  protocol: string;
  get: (h: string) => string | undefined;
}): string | undefined {
  if (process.env.PUBLIC_API_URL) {
    return process.env.PUBLIC_API_URL.replace(/\/+$/, "");
  }
  const forwardedProto = req.get("x-forwarded-proto");
  const proto = forwardedProto?.split(",")[0]?.trim() || req.protocol;
  const host = req.get("host");
  return host ? `${proto}://${host}` : undefined;
}

/**
 * POST /api/uploads/images — multipart field `file`.
 * Returns `{ id, url, contentType, bytes }` where `url` is absolute when
 * the request host / PUBLIC_API_URL is known (so OpenUI Image src can
 * use it as-is in follow-up generations).
 */
uploadsRouter.post("/images", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file uploaded (expected field name 'file')" });
    return;
  }

  try {
    const stored = await storeImage(file.buffer, file.mimetype);
    const url = publicImageUrl(stored.publicPath, resolveBaseUrl(req));
    res.status(201).json({
      id: stored.id,
      url,
      contentType: stored.contentType,
      bytes: stored.bytes,
    });
  } catch (err) {
    log.errorWith("image upload failed", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Internal error storing image",
    });
  }
});

const handleUploadError: ErrorRequestHandler = (err, _req, res, next) => {
  if (
    err instanceof multer.MulterError ||
    (typeof err?.message === "string" &&
      (err.message.includes("JPEG") || err.message.includes("File too large")))
  ) {
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
};

uploadsRouter.use(handleUploadError);
