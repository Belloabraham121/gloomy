"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Bridge so custom OpenUI components (e.g. ImageUpload) can push a
 * follow-up user message into /chat without depending on OpenUI's
 * internal triggerAction hook (which is only available under <Renderer>
 * and doesn't know about our chat thread).
 */
export interface GloomyUiActions {
  continueConversation?: (message: string) => void;
}

const GloomyUiActionsContext = createContext<GloomyUiActions>({});

export function GloomyUiActionsProvider({
  value,
  children,
}: {
  value: GloomyUiActions;
  children: ReactNode;
}) {
  return (
    <GloomyUiActionsContext.Provider value={value}>
      {children}
    </GloomyUiActionsContext.Provider>
  );
}

export function useGloomyUiActions(): GloomyUiActions {
  return useContext(GloomyUiActionsContext);
}
