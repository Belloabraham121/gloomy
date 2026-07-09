import { z } from "zod/v4";

export const formulaStepperSchema = z.object({
  title: z.string(),
  terms: z.array(
    z.object({
      expression: z.string(),
      note: z.string().optional(),
    }),
  ),
});

export type FormulaStepperProps = z.infer<typeof formulaStepperSchema>;
