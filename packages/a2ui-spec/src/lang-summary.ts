// Matches `identifier = ComponentName(` statements in an openui-lang
// program - good enough to list which component types were used without a
// real parser, since this is only ever used for human-readable breadcrumbs
// (conversation-history notes on apps/web, progress-tracking rows on
// apps/api), never re-parsed as code.
const COMPONENT_CALL_RE = /=\s*([A-Z][A-Za-z0-9]*)\(/g;

/**
 * Returns a short, comma-joined list of the distinct component type names
 * used in an openui-lang program (e.g. "Stack, Chart, Table"), capped to
 * `maxNames` names. Falls back to "a response" if none are found (e.g. an
 * empty or unparseable string).
 */
export function summarizeLangComponents(lang: string, maxNames = 4): string {
  const names = new Set<string>();
  for (const match of lang.matchAll(COMPONENT_CALL_RE)) {
    names.add(match[1]);
    if (names.size >= maxNames) break;
  }
  return names.size > 0 ? Array.from(names).join(", ") : "a response";
}
