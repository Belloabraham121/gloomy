import { z } from "zod/v4";

export const diagramSchema = z.object({
  title: z.string(),
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string().optional(),
    }),
  ),
  edges: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      label: z.string().optional(),
    }),
  ),
});

export type DiagramProps = z.infer<typeof diagramSchema>;
