import { OPENUI_SYSTEM_PROMPT } from "./generated/openui-contract.js";

/**
 * The full OpenUI Lang system prompt (syntax rules + every component
 * signature + gloomy's own rules/examples) - generated from
 * apps/web/src/lib/a2ui-library.tsx + openui-prompt-options.ts via
 * `pnpm --filter @gloomy/web generate:openui-contract` and embedded as a
 * committed string. See docs/openui-migration.md for why generation
 * happens on the frontend (which already depends on @openuidev/react-ui)
 * instead of apps/api depending on React just to build the same library.
 */
export const SYSTEM_PROMPT = OPENUI_SYSTEM_PROMPT;
