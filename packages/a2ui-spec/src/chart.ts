import { z } from "zod/v4";

export const chartSchema = z.object({
  title: z.string(),
  kind: z.enum(["line", "bar"]),
  xLabel: z.string(),
  yLabel: z.string(),
  series: z.array(
    z.object({
      name: z.string(),
      points: z.array(
        z.object({
          x: z.union([z.string(), z.number()]),
          y: z.number(),
        }),
      ),
    }),
  ),
});

export type ChartProps = z.infer<typeof chartSchema>;
