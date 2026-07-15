import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  isAllowedImageMime,
  publicImageUrl,
  storeImage,
} from "./store.js";

const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
  delete process.env.UPLOAD_DIR;
});

describe("image upload store", () => {
  it("accepts common image mime types", () => {
    expect(isAllowedImageMime("image/png")).toBe(true);
    expect(isAllowedImageMime("image/jpeg")).toBe(true);
    expect(isAllowedImageMime("application/pdf")).toBe(false);
  });

  it("writes a file and builds a public URL", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "gloomy-uploads-"));
    dirs.push(dir);
    process.env.UPLOAD_DIR = dir;

    // Minimal PNG header is enough for a store test (we don't decode).
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    const stored = await storeImage(png, "image/png");
    expect(stored.publicPath.endsWith(".png")).toBe(true);
    const onDisk = await readFile(path.join(dir, stored.filename));
    expect(onDisk.equals(png)).toBe(true);
    expect(publicImageUrl(stored.publicPath, "https://api.example.com")).toBe(
      `https://api.example.com/uploads/${stored.publicPath}`,
    );
  });
});
