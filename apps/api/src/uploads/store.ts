import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

export function isAllowedImageMime(mime: string): boolean {
  return mime in ALLOWED;
}

export function extensionForMime(mime: string): string | null {
  return ALLOWED[mime] ?? null;
}

/**
 * Directory for uploaded images. Override with UPLOAD_DIR; default is
 * apps/api/data/uploads (gitignored).
 */
export function uploadDir(): string {
  if (process.env.UPLOAD_DIR) return path.resolve(process.env.UPLOAD_DIR);
  return path.resolve(process.cwd(), "data", "uploads");
}

export interface StoredImage {
  id: string;
  filename: string;
  contentType: string;
  bytes: number;
  /** Path segment under /uploads/, e.g. `ab12….jpg`. */
  publicPath: string;
}

/**
 * Writes an image buffer to disk with a content-addressed + uuid id so
 * collisions are vanishingly unlikely and the filename is opaque.
 */
export async function storeImage(
  buffer: Buffer,
  contentType: string,
): Promise<StoredImage> {
  const ext = extensionForMime(contentType);
  if (!ext) {
    throw new Error(`Unsupported image type: ${contentType}`);
  }
  if (buffer.length === 0) {
    throw new Error("Empty image upload");
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} byte limit`);
  }

  const digest = createHash("sha256").update(buffer).digest("hex").slice(0, 12);
  const id = `${digest}-${randomUUID().slice(0, 8)}`;
  const filename = `${id}${ext}`;
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  return {
    id,
    filename,
    contentType,
    bytes: buffer.length,
    publicPath: filename,
  };
}

/** Builds an absolute URL when PUBLIC_API_URL (or a request origin) is known. */
export function publicImageUrl(
  publicPath: string,
  baseUrl: string | undefined,
): string {
  const pathOnly = `/uploads/${publicPath}`;
  if (!baseUrl) return pathOnly;
  return `${baseUrl.replace(/\/+$/, "")}${pathOnly}`;
}
