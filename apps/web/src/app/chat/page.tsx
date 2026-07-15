"use client";

import { useEffect, useRef, useState } from "react";
import { UI_STYLE_OPTIONS, type UiStyleId } from "@gloomy/a2ui-spec";
import { A2uiLangView } from "@/components/A2uiRenderer";
import { askQuestion, ChatApiError, uploadDocument } from "@/lib/api";
import { buildThreadMessages } from "@/lib/chat-history";
import {
  type Conversation,
  deleteConversation,
  listConversations,
  loadConversation,
  newConversationId,
  saveConversation,
  type StoredEntry,
} from "@/lib/conversations";
import { getStoredSessionId, storeSessionId } from "@/lib/session";

const SUGGESTED_PROMPTS = [
  { style: "lesson" as const, text: "Teach me how a circle's area relates to its radius" },
  { style: "report" as const, text: "Write a short report on how a request flows through this app" },
  { style: "pitch" as const, text: "Pitch deck: why generative UI beats wall-of-text answers" },
  {
    style: "form" as const,
    text: "Build a landing-page draft with an ImageUpload so I can add a real hero photo",
  },
];

type DocumentState =
  | { kind: "idle" }
  | { kind: "uploading"; fileName: string }
  | { kind: "ready"; sourceId: string; title: string; chunkCount: number }
  | { kind: "error"; message: string };

export default function ChatPage() {
  const [conversationId, setConversationId] = useState(() => newConversationId());
  const [entries, setEntries] = useState<StoredEntry[]>([]);
  const [question, setQuestion] = useState("");
  const [style, setStyle] = useState<UiStyleId>("auto");
  const [document, setDocument] = useState<DocumentState>({ kind: "idle" });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const busy = entries.some((e) => e.status === "loading");

  useEffect(() => {
    setConversations(listConversations());
  }, []);

  useEffect(() => {
    if (entries.length === 0) return;
    saveConversation(conversationId, entries);
    setConversations(listConversations());
  }, [entries, conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  function startNewChat() {
    setConversationId(newConversationId());
    setEntries([]);
    setDocument({ kind: "idle" });
    setSidebarOpen(false);
  }

  function openConversation(id: string) {
    const convo = loadConversation(id);
    if (!convo) return;
    setConversationId(convo.id);
    setEntries(convo.entries);
    setDocument({ kind: "idle" });
    setSidebarOpen(false);
  }

  function removeConversation(id: string) {
    deleteConversation(id);
    setConversations(listConversations());
    if (id === conversationId) startNewChat();
  }

  async function submit(q: string, forcedStyle?: UiStyleId) {
    if (!q.trim() || busy) return;
    setQuestion("");
    const activeStyle = forcedStyle ?? style;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const threadMessages = buildThreadMessages(entries, q);
    setEntries((prev) => [...prev, { id, question: q, status: "loading" }]);

    const documentId = document.kind === "ready" ? document.sourceId : undefined;

    try {
      const response = await askQuestion(threadMessages, {
        sessionId: getStoredSessionId(),
        documentId,
        style: activeStyle,
        onDelta: (partialLang) => {
          setEntries((prev) =>
            prev.map((e) =>
              e.id === id ? { ...e, streamingLang: partialLang } : e,
            ),
          );
        },
      });
      if (response.sessionId) storeSessionId(response.sessionId);
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, status: "success", response, streamingLang: undefined }
            : e,
        ),
      );
    } catch (err) {
      const errorStatus = err instanceof ChatApiError ? err.status : 0;
      const errorMessage = (err as Error).message;
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                status: "error",
                errorStatus,
                errorMessage,
                streamingLang: undefined,
              }
            : e,
        ),
      );
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const isPdf = file.type === "application/pdf";
    const isCsv =
      file.type === "text/csv" ||
      file.type === "application/vnd.ms-excel" ||
      file.name.toLowerCase().endsWith(".csv");
    if (!isPdf && !isCsv) {
      setDocument({ kind: "error", message: "Only PDF or CSV files are supported right now." });
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
    <main className="lv3-theme chat-app">
      <button
        type="button"
        className="chat-sidebar-toggle"
        aria-label="Toggle conversations"
        onClick={() => setSidebarOpen((v) => !v)}
      >
        ☰
      </button>

      <aside className={`chat-sidebar ${sidebarOpen ? "open" : ""}`}>
        <button type="button" className="chat-new" onClick={startNewChat}>
          ＋ New chat
        </button>
        <div className="chat-convo-list">
          {conversations.length === 0 && (
            <p className="chat-convo-empty">No conversations yet.</p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`chat-convo ${c.id === conversationId ? "active" : ""}`}
            >
              <button
                type="button"
                className="chat-convo-open"
                onClick={() => openConversation(c.id)}
              >
                {c.title}
              </button>
              <button
                type="button"
                className="chat-convo-del"
                aria-label="Delete conversation"
                onClick={() => removeConversation(c.id)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="chat-main">
        <div className="chat-scroll">
          {entries.length === 0 ? (
            <div className="chat-empty">
              <h1 className="chat-empty-title">What should we generate?</h1>
              <p className="chat-empty-sub">
                Reports, pitch decks, dashboards, lessons, forms — gloomy
                composes a full interactive OpenUI document, not a wall of text.
              </p>
              <div className="chat-suggestions">
                {SUGGESTED_PROMPTS.map((s) => (
                  <button
                    key={s.text}
                    type="button"
                    className="chat-suggestion"
                    onClick={() => {
                      setStyle(s.style);
                      void submit(s.text, s.style);
                    }}
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-thread">
              {entries.map((entry) => (
                <ChatTurn
                  key={entry.id}
                  entry={entry}
                  onContinue={(msg) => void submit(msg)}
                />
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="chat-composer-wrap">
          <div className="chat-style-row" role="group" aria-label="UI style">
            {UI_STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`chat-style-chip ${style === opt.id ? "active" : ""}`}
                title={opt.hint}
                onClick={() => setStyle(opt.id)}
                disabled={busy}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {document.kind === "ready" && (
            <span className="a2ui-doc-chip chat-doc-chip">
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
            <span className="a2ui-doc-error chat-doc-chip">{document.message}</span>
          )}

          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void submit(question);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,text/csv,.csv"
              onChange={handleFileChange}
              className="a2ui-upload-input"
              aria-label="Upload a PDF or CSV to ground the conversation"
            />
            <button
              type="button"
              className="chat-attach"
              onClick={() => fileInputRef.current?.click()}
              disabled={document.kind === "uploading"}
              aria-label="Attach a PDF or CSV"
              title="Attach a PDF or CSV"
            >
              {document.kind === "uploading" ? "…" : "＋"}
            </button>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask for a report, pitch, dashboard, lesson…"
              className="chat-input"
              aria-label="Your question"
            />
            <button type="submit" className="chat-send" disabled={busy || !question.trim()}>
              ↑
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function ChatTurn({
  entry,
  onContinue,
}: {
  entry: StoredEntry;
  onContinue: (message: string) => void;
}) {
  return (
    <div className="chat-turn">
      <div className="chat-msg user">{entry.question}</div>

      {entry.status === "loading" && (
        <div className="chat-msg assistant">
          {entry.streamingLang ? (
            <div className="lv3-stage">
              <A2uiLangView
                lang={entry.streamingLang}
                isStreaming
                onContinueConversation={onContinue}
              />
            </div>
          ) : (
            <div className="status loading">
              Composing your interactive UI&hellip;
            </div>
          )}
        </div>
      )}

      {entry.status === "error" && (
        <div className="chat-msg assistant">
          <div className="status error">
            {entry.errorStatus === 501
              ? `No LLM provider is configured on apps/api yet: ${entry.errorMessage}`
              : `Request failed (${entry.errorStatus || "network error"}): ${entry.errorMessage}`}
          </div>
        </div>
      )}

      {entry.status === "success" && entry.response && (
        <div className="chat-msg assistant">
          <div className="lv3-stage">
            {entry.response.cached && (
              <p className="a2ui-chat-cached-note">Served from cache</p>
            )}
            <A2uiLangView
              lang={entry.response.lang}
              onContinueConversation={onContinue}
            />
          </div>
        </div>
      )}
    </div>
  );
}
