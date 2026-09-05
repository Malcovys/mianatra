import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);

export const generatedRevisionSheetSchema = z
  .object({
    title: nonEmptyText,
    summary: nonEmptyText,
    keyConcepts: z.array(nonEmptyText),
    definitions: z.array(nonEmptyText),
    formulas: z.array(nonEmptyText),
    examples: z.array(nonEmptyText),
    commonMistakes: z.array(nonEmptyText),
    importantPoints: z.array(nonEmptyText),
  })
  .strict();

export type GeneratedRevisionSheet = z.output<typeof generatedRevisionSheetSchema>;
