import { a2uiRegistry, type A2uiComponentName, type A2uiPayload } from "@gloomy/a2ui-spec";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class ToolUseError extends Error {}

export class MissingApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingApiKeyError";
  }
}

function isA2uiComponentName(name: string): name is A2uiComponentName {
  return name in a2uiRegistry;
}

/**
 * The single gate both providers pass through: whatever the model returned
 * is parsed against the same Zod schema the frontend renders with. Model
 * output is never trusted as-is, regardless of provider.
 */
export function validatePayload(name: string, input: unknown): A2uiPayload {
  if (!isA2uiComponentName(name)) {
    throw new ToolUseError(`Unknown component "${name}"`);
  }
  const entry = a2uiRegistry[name];
  const result = entry.schema.safeParse(input);
  if (!result.success) {
    throw new ToolUseError(
      `Invalid props for ${name}: ${result.error.message}`,
    );
  }
  return { component: name, props: result.data } as A2uiPayload;
}
