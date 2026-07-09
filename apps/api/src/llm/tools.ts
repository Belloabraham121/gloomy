import { a2uiRegistry, type A2uiComponentName } from "@gloomy/a2ui-spec";
import { z } from "zod/v4";

export interface A2uiToolSpec {
  name: A2uiComponentName;
  description: string;
  /** Plain JSON Schema (type: "object" at the top level, no $schema noise). */
  jsonSchema: Record<string, unknown>;
}

function toPlainJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema, id, ...rest } = z.toJSONSchema(schema) as Record<
    string,
    unknown
  >;
  return rest;
}

/** Provider-neutral tool specs; each provider maps these into its own tool format. */
export const a2uiToolSpecs: A2uiToolSpec[] = (
  Object.keys(a2uiRegistry) as A2uiComponentName[]
).map((name) => ({
  name,
  description: a2uiRegistry[name].description,
  jsonSchema: toPlainJsonSchema(a2uiRegistry[name].schema as z.ZodType),
}));
