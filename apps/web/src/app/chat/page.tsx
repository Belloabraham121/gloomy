"use client";

import { useRef, useState } from "react";
import { A2uiRenderer } from "@/components/A2uiRenderer";
import {
  askQuestion,
  ChatApiError,
  uploadDocument,
  type ChatResponse,
} from "@/lib/api";
import { getStoredSessionId, storeSessionId } from "@/lib/session";

const SUGGESTED_QUESTIONS = [
  "How does a circle's area relate to its radius?",
  "Walk me through how a request flows through this app.",
  "Quiz me on the difference between A2A and A2MCP.",
];

interface CanvasEntry {
  id: string;
  question: string;
  status: "loading" | "success" | "error";
  response?: ChatResponse;
  errorStatus?: number;
  errorMessage?: string;
}

type DocumentState =
  | { kind: "idle" }
  | { kind: "uploading"; fileName: string }
  | { kind: "ready"; sourceId: string; title: string; chunkCount: number }
  | { kind: "error"; message: string };

function newEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [entries, setEntries] = useState<CanvasEntry[]>([]);
  const [document, setDocument] = useState<DocumentState>({ kind: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = entries.some((e) => e.status === "loading");

  async function submit(q: string) {
    if (!q.trim() || busy) return;
    setQuestion("");
    const id = newEntryId();
    setEntries((prev) => [...prev, { id, question: q, status: "loading" }]);

    const documentId = document.kind === "ready" ? document.sourceId : undefined;

    try {
      const response = await askQuestion(q, getStoredSessionId(), documentId);
      if (response.sessionId) storeSessionId(response.sessionId);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "success", response } : e)),
      );
    } catch (err) {
      const errorStatus = err instanceof ChatApiError ? err.status : 0;
      const errorMessage = (err as Error).message;
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, status: "error", errorStatus, errorMessage } : e,
        ),
      );
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf") {
      setDocument({ kind: "error", message: "Only PDF files are supported right now." });
      return;
    }

    setDocument({ kind: "uploading", fileName: file.name });
    try {
      const result = await uploadDocument(file, getStoredSessionId());
      setDocument({
        kind: "ready",
        sourceId: result.sourceId,
        title: result.title,
        chunkCount: result.chunkCount,
      });
    } catch (err) {
      const message =
        err instanceof ChatApiError ? err.message : (err as Error).message;
      setDocument({ kind: "error", message });
    }
  }

  return (
    <main>
      <p className="hero-eyebrow">Generative learning canvas</p>
      <h1 className="hero-title">
        Ask anything. <em>Watch it build.</em>
      </h1>
      <p className="hero-sub">
        Every question adds a new interactive component to the canvas below —
        upload a PDF first to ground the whole conversation in it.
      </p>

      <div className="a2ui-upload-row">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="a2ui-upload-input"
          aria-label="Upload a PDF to ground the canvas"
        />
        <button
          type="button"
          className="a2ui-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={document.kind === "uploading"}
        >
          {document.kind === "uploading" ? "Uploading…" : "Upload a PDF"}
        </button>

        {document.kind === "ready" && (
          <span className="a2ui-doc-chip">
            Grounded in: {document.title}
            <button
              type="button"
              className="a2ui-doc-chip-clear"
              onClick={() => setDocument({ kind: "idle" })}
              aria-label="Clear grounding document"
            >
              &times;
            </button>
          </span>
        )}

        {document.kind === "error" && (
          <span className="a2ui-doc-error">{document.message}</span>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(question);
        }}
        className="a2ui-chat-form"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="How does gradient descent actually work?"
          className="a2ui-chat-input"
          aria-label="Your question"
        />
        <button type="submit" className="a2ui-button primary" disabled={busy}>
          Ask
        </button>
      </form>

      <div className="a2ui-chat-suggestions">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            className="a2ui-button"
            onClick={() => submit(q)}
            disabled={busy}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="a2ui-canvas-stack">
        {entries.map((entry) => (
          <section key={entry.id} className="a2ui-canvas-card">
            <p className="a2ui-canvas-card-question">{entry.question}</p>

            {entry.status === "loading" && (
              <div className="status loading">
                Thinking about the best way to show this&hellip;
              </div>
            )}

            {entry.status === "error" && entry.errorStatus === 501 && (
              <div className="status error">
                No LLM provider is configured on apps/api yet: {entry.errorMessage}
              </div>
            )}
            {entry.status === "error" && entry.errorStatus !== 501 && (
              <div className="status error">
                Request failed ({entry.errorStatus || "network error"}):{" "}
                {entry.errorMessage}
              </div>
            )}

            {entry.status === "success" && entry.response && (
              <div className="a2ui-chat-result">
                {entry.response.cached && (
                  <p className="a2ui-chat-cached-note">Served from cache</p>
                )}
                <A2uiRenderer payload={entry.response} />
              </div>
            )}
          </section>
        ))}
      </div>

      <p className="a2ui-chat-gallery-link">
        Browse the full component catalog with sample data in the{" "}
        <a href="/gallery">gallery</a>.
      </p>
    </main>
  );
}
