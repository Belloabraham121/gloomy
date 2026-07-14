"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import { Renderer, type ActionEvent } from "@openuidev/react-lang";
import { isLangDeliverable, type A2uiDeliverable } from "@gloomy/a2ui-spec";
import { a2uiComponents, a2uiLibrary } from "@/lib/a2ui-library";

/**
 * OpenUI's built-in Charts (recharts under the hood, e.g. their tooltip
 * portal) touch `document` unconditionally on render, which throws during
 * SSR - Next.js recovers by silently re-rendering that subtree client-only,
 * but that still means an SSR error on every request and a visible content
 * swap. Since every page that renders OpenUI content is already a Client
 * Component, there's no SEO/first-paint value in SSR-ing it anyway - so
 * gate the whole Renderer tree behind a mount check and skip SSR
 * deliberately, instead of relying on Next's recovery path. See
 * docs/openui-migration.md.
 */
function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * Catches render-time exceptions from either the OpenUI Renderer or the
 * legacy direct-component path (a malformed custom-component prop shape
 * that slipped past Zod, a third-party chart choking on an edge case,
 * etc.) so one bad response degrades to a message instead of crashing the
 * whole chat/deliverable page. See docs/openui-migration.md.
 */
class RenderBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="status error">
          This response couldn&apos;t be rendered.
        </div>
      );
    }
    return this.props.children;
  }
}

function onAction(event: ActionEvent) {
  if (event.type === "open_url" && typeof event.params.url === "string") {
    window.open(event.params.url, "_blank", "noopener,noreferrer");
  }
  // "continue_conversation" (Buttons/FollowUp) and other action types are
  // intentionally not wired to auto-resubmit yet - see
  // docs/openui-migration.md "left partial" section.
}

/**
 * Renders an OpenUI Lang program (the current contract) through the
 * extended library, or falls back to the legacy direct-component path for
 * a pre-migration `{component, props}` payload (old cached rows, old
 * `/d?p=...` links). Never trusts the Lang string beyond what the
 * Renderer's own parser already guards - see A2uiLangView for the plain
 * `lang: string` shortcut used by the chat page for freshly-generated
 * responses (which are never legacy).
 */
export function A2uiRenderer({ deliverable }: { deliverable: A2uiDeliverable }) {
  const mounted = useMounted();

  if (isLangDeliverable(deliverable)) {
    return <A2uiLangView lang={deliverable.lang} />;
  }

  if (!mounted) return <RenderPlaceholder />;

  const Component = a2uiComponents[deliverable.component] as React.ComponentType<
    typeof deliverable.props
  >;
  return (
    <RenderBoundary>
      <Component {...deliverable.props} />
    </RenderBoundary>
  );
}

/** Renders a raw OpenUI Lang string directly - the shortcut the chat page uses for its own fresh responses. */
export function A2uiLangView({
  lang,
  isStreaming = false,
}: {
  lang: string;
  isStreaming?: boolean;
}) {
  const mounted = useMounted();
  if (!mounted) return <RenderPlaceholder />;

  return (
    <RenderBoundary>
      <Renderer
        response={lang}
        library={a2uiLibrary}
        isStreaming={isStreaming}
        onAction={onAction}
      />
    </RenderBoundary>
  );
}

function RenderPlaceholder() {
  return <div className="status loading">Loading…</div>;
}
