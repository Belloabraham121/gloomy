import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { a2uiLibrary } from "@/lib/a2ui-library";
import { gloomyPromptOptions } from "@/lib/openui-prompt-options";

/**
 * Generates apps/api's server-side OpenUI Lang contract from the exact same
 * library apps/web renders with, and embeds it as a committed TS file -
 * see docs/openui-migration.md ("Why generate, not import react-ui on the
 * server") for why apps/api doesn't depend on @openuidev/react-ui directly
 * (it would drag React/recharts/radix into an Express server that never
 * renders anything).
 *
 * Run via `pnpm --filter @gloomy/web generate:openui-contract` whenever the
 * library changes (new/changed component, new custom component, changed
 * prompt options) and commit the regenerated file.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(
  __dirname,
  "../../api/src/llm/generated/openui-contract.ts",
);

const prompt = a2uiLibrary.prompt(gloomyPromptOptions);
const schema = a2uiLibrary.toJSONSchema();
const componentNames = Object.keys(a2uiLibrary.components).sort();

const banner = `// GENERATED FILE - do not hand-edit.
// Produced by \`pnpm --filter @gloomy/web generate:openui-contract\` from
// apps/web/src/lib/a2ui-library.tsx + apps/web/src/lib/openui-prompt-options.ts.
// Regenerate whenever the OpenUI component library or prompt options
// change, and commit the result. See docs/openui-migration.md.
`;

const contents = `${banner}
/** The full system prompt: OpenUI Lang syntax + every component signature + gloomy's rules/examples. */
export const OPENUI_SYSTEM_PROMPT = ${JSON.stringify(prompt)};

/** library.toJSONSchema() output - used server-side to validate/parse model output before trusting it (see llm/shared.ts). */
export const OPENUI_LIBRARY_SCHEMA = ${JSON.stringify(schema, null, 2)} as const;

/** Every component name the model is allowed to use, for logging/debugging. */
export const OPENUI_COMPONENT_NAMES = ${JSON.stringify(componentNames, null, 2)} as const;

/** The library's designated root component type (see library.root). */
export const OPENUI_ROOT_COMPONENT = ${JSON.stringify(a2uiLibrary.root ?? null)};
`;

writeFileSync(OUT_PATH, contents, "utf8");

console.log(`Wrote ${OUT_PATH}`);
console.log(`  ${componentNames.length} components: ${componentNames.join(", ")}`);
console.log(`  prompt: ${prompt.length} chars`);
