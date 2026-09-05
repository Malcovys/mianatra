import { z } from "zod";

export const generatedExerciseTypes = ["multiple_choice", "true_false", "short_answer", "numeric"] as const;

const nonEmptyText = z.string().trim().min(1);

export const generatedExerciseSchema = z
  .object({
    type: z.enum(generatedExerciseTypes),
    question: nonEmptyText,
    expectedAnswer: nonEmptyText,
    options: z.array(nonEmptyText).nullable(),
    hint: nonEmptyText.nullable(),
    explanation: nonEmptyText,
    conceptReference: nonEmptyText,
    difficulty: z.number().int().min(1).max(3),
    generatedFromWeakness: z.boolean(),
  })
  .strict();

export const generatedExercisesSchema = z
  .object({
    exercises: z.array(generatedExerciseSchema).min(3).max(5),
  })
  .strict();

export const exerciseGenerationSchema = generatedExercisesSchema;
export type GeneratedExercise = z.output<typeof generatedExerciseSchema>;
export type GeneratedExercisesOutput = z.output<typeof generatedExercisesSchema>;
