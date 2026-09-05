import { z } from "zod";
import { coursePageAnalysisSchema, coursePageConceptSchema, supportedCoursePageMimeTypes } from "./course-page-analysis.schema";

export const analyzeCoursePagesInputSchema = z
  .object({
    courseId: z.string().trim().min(1).nullable().optional(),
    pages: z
      .array(
        z
          .object({
            pageId: z.string().trim().min(1).nullable().optional(),
            pageIndex: z.number().int().min(0),
            imageBase64: z
              .string()
              .trim()
              .min(1)
              .refine((value) => !value.startsWith("data:"), "imageBase64 must not contain a data URL prefix.")
              .refine((value) => !/^(file|content|blob):/i.test(value), "imageBase64 must not be a local URI."),
            mimeType: z.enum(supportedCoursePageMimeTypes),
          })
          .strict(),
      )
      .min(1)
      .max(5),
    knownSubject: z.string().trim().min(1).nullable().optional(),
    knownGrade: z.string().trim().min(1).nullable().optional(),
    additionalInstructions: z.string().trim().min(1).nullable().optional(),
  })
  .strict()
  .superRefine((input, context) => {
    const seen = new Set<number>();
    for (const page of input.pages) {
      if (seen.has(page.pageIndex)) {
        context.addIssue({
          code: "custom",
          path: ["pages"],
          message: "pageIndex values must be unique.",
        });
        return;
      }
      seen.add(page.pageIndex);
    }
  });

const pageAnalysisResultSchema = z
  .object({
    pageId: z.string().nullable(),
    pageIndex: z.number().int().min(0),
    status: z.enum(["success", "failed"]),
    analysis: coursePageAnalysisSchema.nullable(),
    errorCode: z.string().nullable(),
    errorMessage: z.string().nullable(),
    attemptsCount: z.number().int().min(1).max(2),
  })
  .strict();

const analysisInconsistencySchema = z
  .object({
    field: z.enum(["title", "subject", "level"]),
    values: z.array(
      z
        .object({
          value: z.string().trim().min(1),
          pageIndexes: z.array(z.number().int().min(0)),
        })
        .strict(),
    ),
    selectedValue: z.string().trim().min(1).nullable(),
  })
  .strict();

export const multiPageCourseConceptSchema = coursePageConceptSchema.extend({
  sourcePageIndexes: z.array(z.number().int().min(0)),
});

export const multiPageCourseAnalysisSchema = z
  .object({
    detectedTitle: z.string().trim().min(1),
    detectedSubject: z.string().trim().min(1),
    detectedLevel: z.string().trim().min(1).nullable(),
    concepts: z.array(multiPageCourseConceptSchema),
    definitions: z.array(z.string()),
    formulas: z.array(z.string()),
    examples: z.array(z.string()),
    dates: z.array(z.string()),
    keywords: z.array(z.string()),
    summary: z.string(),
    warnings: z.array(z.string()),
    confidence: z.number().min(0).max(1).nullable(),
    successfulPageCount: z.number().int().min(0),
    failedPageCount: z.number().int().min(0),
    pageResults: z.array(pageAnalysisResultSchema),
    inconsistencies: z.array(analysisInconsistencySchema),
  })
  .strict();

export type AnalyzeCoursePagesInput = z.input<typeof analyzeCoursePagesInputSchema>;
export type MultiPageCourseAnalysis = z.output<typeof multiPageCourseAnalysisSchema>;
export type MultiPageCourseConcept = z.output<typeof multiPageCourseConceptSchema>;
export type AnalysisInconsistency = z.output<typeof analysisInconsistencySchema>;
export type PageAnalysisResult = z.output<typeof pageAnalysisResultSchema>;
