"use client";

import type { A2uiPayload } from "@gloomy/a2ui-spec";
import { a2uiComponents } from "@/lib/a2ui-library";

/**
 * Dispatches a { component, props } payload (from apps/api's Claude
 * tool-use response) straight to the matching React component - the same
 * direct-render path the /gallery fixture page uses. See
 * docs/architecture.md for why this bypasses OpenUI's Lang parser.
 */
export function A2uiRenderer({ payload }: { payload: A2uiPayload }) {
  const Component = a2uiComponents[payload.component] as React.ComponentType<
    typeof payload.props
  >;
  return <Component {...payload.props} />;
}
