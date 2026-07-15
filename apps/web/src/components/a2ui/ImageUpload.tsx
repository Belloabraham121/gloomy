"use client";

import { useRef, useState } from "react";
import type { ImageUploadProps } from "@gloomy/a2ui-spec";
import { uploadImage, ChatApiError } from "@/lib/api";
import { useGloomyUiActions } from "@/lib/gloomy-ui-actions";

interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

export function ImageUpload({
  label = "Upload image",
  description,
  multiple = false,
  maxFiles,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { continueConversation } = useGloomyUiActions();
  const cap = multiple ? Math.min(maxFiles ?? 4, 12) : 1;

  const [items, setItems] = useState<UploadedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length || busy) return;
    setError(null);

    const remaining = cap - items.length;
    if (remaining <= 0) {
      setError(`You can upload at most ${cap} image${cap === 1 ? "" : "s"}.`);
      return;
    }

    const selected = Array.from(fileList).slice(0, remaining);
    setBusy(true);
    try {
      const uploaded: UploadedImage[] = [];
      for (const file of selected) {
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} is not an image`);
        }
        const result = await uploadImage(file);
        uploaded.push({ id: result.id, url: result.url, name: file.name });
      }
      setItems((prev) => (multiple ? [...prev, ...uploaded] : uploaded));
    } catch (err) {
      const message =
        err instanceof ChatApiError ? err.message : (err as Error).message;
      setError(message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function useInNextAnswer() {
    if (!continueConversation || items.length === 0) return;
    const lines = items.map((i) => `- ${i.url}`);
    continueConversation(
      [
        "I uploaded image(s) for this UI. Use these public URL(s) with Image, ImageBlock, or ImageGallery in your next openui-lang response:",
        ...lines,
      ].join("\n"),
    );
  }

  return (
    <div className="a2ui-card a2ui-image-upload">
      <h3 className="a2ui-title">{label}</h3>
      {description && <p className="a2ui-image-upload-desc">{description}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={multiple}
        className="a2ui-upload-input"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <div className="a2ui-image-upload-actions">
        <button
          type="button"
          className="a2ui-button primary"
          disabled={busy || items.length >= cap}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Uploading…" : multiple ? "Choose images" : "Choose image"}
        </button>
        {continueConversation && items.length > 0 && (
          <button
            type="button"
            className="a2ui-button"
            disabled={busy}
            onClick={useInNextAnswer}
          >
            Use in next answer
          </button>
        )}
      </div>

      {error && <p className="a2ui-doc-error">{error}</p>}

      {items.length > 0 && (
        <ul className="a2ui-image-upload-grid">
          {items.map((item) => (
            <li key={item.id} className="a2ui-image-upload-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.name} />
              <div className="a2ui-image-upload-meta">
                <span className="a2ui-image-upload-name" title={item.name}>
                  {item.name}
                </span>
                <button
                  type="button"
                  className="a2ui-doc-chip-clear"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => removeAt(item.id)}
                >
                  &times;
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
