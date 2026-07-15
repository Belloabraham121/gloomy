"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import {
  BuiltinActionType,
  Renderer,
  type ActionEvent,
} from "@openuidev/react-lang";
import { isLangDeliverable, type A2uiDeliverable } from "@gloomy/a2ui-spec";
import { a2uiComponents, a2uiLibrary } from "@/lib/a2ui-library";
import { GloomyUiActionsProvider } from "@/lib/gloomy-ui-actions";

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
 * legacy direct-component path so one bad response degrades to a message
 * instead of crashing the whole chat/deliverable page.
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

function defaultOnAction(event: ActionEvent) {
  if (
    event.type === BuiltinActionType.OpenUrl &&
    typeof event.params?.url === "string"
  ) {
    window.open(event.params.url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Renders an OpenUI Lang program (the current contract) through the
 * extended library, or falls back to the legacy direct-component path for
 * a pre-migration `{component, props}` payload.
 */
export function A2uiRenderer({
  deliverable,
  onContinueConversation,
}: {
  deliverable: A2uiDeliverable;
  onContinueConversation?: (message: string) => void;
}) {
  const mounted = useMounted();

  if (isLangDeliverable(deliverable)) {
    return (
      <A2uiLangView
        lang={deliverable.lang}
        onContinueConversation={onContinueConversation}
      />
    );
  }

  if (!mounted) return <RenderPlaceholder />;

  const ComponentView = a2uiComponents[deliverable.component] as React.ComponentType<
    typeof deliverable.props
  >;
  return (
    <RenderBoundary>
      <ComponentView {...deliverable.props} />
    </RenderBoundary>
  );
}

/** Renders a raw OpenUI Lang string — used by /chat for fresh responses. */
export function A2uiLangView({
  lang,
  isStreaming = false,
  onContinueConversation,
}: {
  lang: string;
  isStreaming?: boolean;
  onContinueConversation?: (message: string) => void;
}) {
  const mounted = useMounted();
  if (!mounted) return <RenderPlaceholder />;

  function onAction(event: ActionEvent) {
    if (
      event.type === BuiltinActionType.ContinueConversation &&
      onContinueConversation
    ) {
      const message = event.humanFriendlyMessage?.trim();
      if (message) onContinueConversation(message);
      return;
    }
    defaultOnAction(event);
  }

  return (
    <GloomyUiActionsProvider
      value={{ continueConversation: onContinueConversation }}
    >
      <RenderBoundary>
        <Renderer
          response={lang}
          library={a2uiLibrary}
          isStreaming={isStreaming}
          onAction={onAction}
        />
      </RenderBoundary>
    </GloomyUiActionsProvider>
  );
}

function RenderPlaceholder() {
  return <div className="status loading">Loading…</div>;
}
