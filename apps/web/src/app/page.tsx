"use client";

import { useState } from "react";
import { A2uiRenderer } from "@/components/A2uiRenderer";
import { askQuestion, ChatApiError, type ChatResponse } from "@/lib/api";
import { getStoredSessionId, storeSessionId } from "@/lib/session";

const SUGGESTED_QUESTIONS = [
  "How does a circle's area relate to its radius?",
  "Walk me through how a request flows through this app.",
  "Quiz me on the difference between A2A and A2MCP.",
];

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; response: ChatResponse }
  | { kind: "error"; status: number; message: string };

export default function Home() {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function submit(q: string) {
    if (!q.trim() || state.kind === "loading") return;
    setState({ kind: "loading" });
    try {
      const response = await askQuestion(q, getStoredSessionId());
      if (response.sessionId) storeSessionId(response.sessionId);
      setState({ kind: "success", response });
    } catch (err) {
      if (err instanceof ChatApiError) {
        setState({ kind: "error", status: err.status, message: err.message });
      } else {
        setState({
          kind: "error",
          status: 0,
          message: (err as Error).message,
        });
      }
    }
  }

  return (
    <main>
      <p className="hero-eyebrow">Generative learning UI</p>
      <h1 className="hero-title">
        Ask anything. <em>See the answer.</em>
      </h1>
      <p className="hero-sub">
        One question in, one interactive component out — a diagram, a
        step-through, a quiz, a live simulation — instead of a wall of chat
        text.
      </p>

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
        <button
          type="submit"
          className="a2ui-button primary"
          disabled={state.kind === "loading"}
        >
          Ask
        </button>
      </form>

      <div className="a2ui-chat-suggestions">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            className="a2ui-button"
            onClick={() => {
              setQuestion(q);
              submit(q);
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {state.kind === "loading" && (
        <div className="status loading">Thinking about the best way to show this&hellip;</div>
      )}

      {state.kind === "error" && state.status === 501 && (
        <div className="status error">
          No LLM provider is configured on apps/api yet: {state.message}
        </div>
      )}
      {state.kind === "error" && state.status !== 501 && (
        <div className="status error">
          Request failed ({state.status || "network error"}): {state.message}
        </div>
      )}

      {state.kind === "success" && (
        <div className="a2ui-chat-result">
          {state.response.cached && (
            <p className="a2ui-chat-cached-note">Served from cache</p>
          )}
          <A2uiRenderer payload={state.response} />
        </div>
      )}

      <p className="a2ui-chat-gallery-link">
        Browse the full component catalog with sample data in the{" "}
        <a href="/gallery">gallery</a>.
      </p>
    </main>
  );
}
