import { a2uiRegistry, type A2uiComponentName } from "@gloomy/a2ui-spec";
import { z } from "zod/v4";
import type Anthropic from "@anthropic-ai/sdk";

export type AnthropicTool = Anthropic.Tool;

function toAnthropicInputSchema(
  jsonSchema: Record<string, unknown>,
): AnthropicTool["input_schema"] {
  // Anthropic's tool input_schema wants a plain JSON-Schema object with
  // type: "object" at the top level, no $schema/$id noise.
  const { $schema, id, ...rest } = jsonSchema;
  return rest as AnthropicTool["input_schema"];
}

export const a2uiTools: AnthropicTool[] = (
  Object.keys(a2uiRegistry) as A2uiComponentName[]
).map((name) => {
  const entry = a2uiRegistry[name];
  return {
    name,
    description: entry.description,
    input_schema: toAnthropicInputSchema(
      z.toJSONSchema(entry.schema as z.ZodType),
    ),
  };
});
