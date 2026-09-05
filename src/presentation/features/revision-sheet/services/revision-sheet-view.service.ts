import type { RevisionSheet } from "@/src/db";
import { generatedRevisionSheetSchema, type GeneratedRevisionSheet } from "../schemas/generated-revision-sheet.schema";

export type RevisionSheetViewState =
  | { status: "missing" }
  | { status: "invalid"; sheet: RevisionSheet }
  | { status: "ready"; sheet: RevisionSheet; content: GeneratedRevisionSheet };

export function parseRevisionSheetContent(sheet: RevisionSheet): RevisionSheetViewState {
  try {
    return {
      status: "ready",
      sheet,
      content: generatedRevisionSheetSchema.parse(JSON.parse(sheet.contentJson)),
    };
  } catch {
    return { status: "invalid", sheet };
  }
}

export async function loadLatestRevisionSheet(courseId: string): Promise<RevisionSheetViewState> {
  const { revisionSheetsRepository } = await import("@/src/db");
  const sheet = await revisionSheetsRepository.findLatestByCourse(courseId);
  return sheet ? parseRevisionSheetContent(sheet) : { status: "missing" };
}
