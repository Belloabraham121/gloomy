import { z } from "zod/v4";

export const stepThroughSchema = z.object({
  title: z.string(),
  steps: z.array(
    z.object({
      heading: z.string(),
      body: z.string(),
      highlight: z.string().optional(),
    }),
  ),
});

export type StepThroughProps = z.infer<typeof stepThroughSchema>;
