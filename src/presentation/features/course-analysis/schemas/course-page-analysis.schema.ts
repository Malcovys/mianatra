import { z } from "zod";

export const supportedCoursePageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export const coursePageAnalysisInputSchema = z
  .object({
    courseId: z.string().trim().min(1).nullable(),
    pageIndex: z.number().int().min(0),
    imageBase64: z
      .string()
      .trim()
      .min(1)
      .refine((value) => !value.startsWith("data:"), "imageBase64 must not contain a data URL prefix."),
    mimeType: z.enum(supportedCoursePageMimeTypes),
    knownSubject: z.string().trim().min(1).nullable(),
    knownGrade: z.string().trim().min(1).nullable(),
    additionalInstructions: z.string().trim().min(1).nullable(),
  })
  .strict();

export const coursePageConceptSchema = z
  .object({
    name: z.string().trim().min(1),
    description: z.string().trim().min(1).nullable(),
  })
  .strict();

export const coursePageAnalysisSchema = z
  .object({
    detectedTitle: z.string().trim().min(1),
    detectedSubject: z.string().trim().min(1),
    detectedLevel: z.string().trim().min(1).nullable(),
    concepts: z.array(coursePageConceptSchema),
    definitions: z.array(z.string()),
    formulas: z.array(z.string()),
    examples: z.array(z.string()),
    dates: z.array(z.string()),
    keywords: z.array(z.string()),
    partialSummary: z.string(),
    warnings: z.array(z.string()),
    confidence: z.number().min(0).max(1).nullable(),
  })
  .strict();

export type CoursePageAnalysisInput = z.input<typeof coursePageAnalysisInputSchema>;
export type CoursePageAnalysis = z.output<typeof coursePageAnalysisSchema>;
export type CoursePageConcept = z.output<typeof coursePageConceptSchema>;
