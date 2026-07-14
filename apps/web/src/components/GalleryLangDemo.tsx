"use client";

import dynamic from "next/dynamic";

// `ssr: false` is only allowed inside a Client Component (App Router
// restriction) - this wrapper exists purely so gallery/page.tsx (a Server
// Component) can render a chart-bearing OpenUI Lang example without it being
// included in the build-time prerender pass, where recharts' DOM
// measurements (`document`) aren't available. See docs/openui-migration.md.
const A2uiLangView = dynamic(
  () => import("@/components/A2uiRenderer").then((m) => m.A2uiLangView),
  { ssr: false, loading: () => <p className="status">Loading…</p> },
);

export function GalleryLangDemo({ lang }: { lang: string }) {
  return <A2uiLangView lang={lang} />;
}
