import { z } from "zod/v4";

export const simulationSchema = z.object({
  title: z.string(),
  description: z.string(),
  parameters: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      min: z.number(),
      max: z.number(),
      step: z.number(),
      defaultValue: z.number(),
    }),
  ),
  formula: z.string(),
});

export type SimulationProps = z.infer<typeof simulationSchema>;
