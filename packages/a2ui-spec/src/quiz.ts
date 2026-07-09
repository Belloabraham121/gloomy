import { z } from "zod/v4";

export const quizSchema = z.object({
  question: z.string(),
  choices: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    }),
  ),
  correctChoiceId: z.string(),
  explanation: z.string(),
});

export type QuizProps = z.infer<typeof quizSchema>;
