import type { Course, CoursePage } from "@/src/db";
import type { CourseFromPagesInput, ImportPageInput } from "./course-import.service";

export const MAX_GALLERY_COURSE_PAGES = 5;

export type SupportedCourseImageMimeType = "image/jpeg" | "image/png" | "image/webp";

export type GalleryImportErrorCode =
  | "permission_denied"
  | "empty_selection"
  | "too_many_images"
  | "unsupported_format"
  | "local_copy_failed"
  | "course_creation_failed";

export class GalleryImportError extends Error {
  constructor(
    public readonly code: GalleryImportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GalleryImportError";
  }
}

export type PickedGalleryAsset = {
  uri: string;
  assetId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
};

export type SelectedCoursePage = {
  id: string;
  sourceUri: string;
  localUri?: string;
  mimeType: SupportedCourseImageMimeType;
  pageIndex: number;
  fileName: string;
  width?: number | null;
  height?: number | null;
};

export type PickGalleryImagesResult =
  | { status: "cancelled" }
  | { status: "selected"; pages: SelectedCoursePage[] };

export type GalleryPickerGateway = {
  pickImages: () => Promise<{ status: "cancelled" } | { status: "selected"; assets: PickedGalleryAsset[] }>;
};

export type GalleryFileGateway = {
  createImportDirectory: () => Promise<string>;
  copyToDirectory: (sourceUri: string, directoryUri: string, fileName: string) => Promise<string>;
  deleteFiles: (uris: string[]) => Promise<void>;
};

export type GalleryCourseGateway = {
  createCourseFromPages: (input: CourseFromPagesInput) => Promise<{ course: Course; pages: CoursePage[] }>;
};

export type CreateGalleryCourseInput = {
  subjectId: string;
  title: string;
  grade: string;
  pages: SelectedCoursePage[];
};

export type GalleryCourseCreationResult = {
  course: Course;
  pages: CoursePage[];
  copiedFileUris: string[];
};

function normalizeTitle(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function extensionFromMimeType(mimeType: SupportedCourseImageMimeType) {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }
  if (mimeType === "image/webp") {
    return "webp";
  }
  return "png";
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function inferMimeType(asset: PickedGalleryAsset): SupportedCourseImageMimeType | null {
  const mimeType = asset.mimeType?.toLocaleLowerCase();
  if (mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/webp") {
    return mimeType;
  }

  const lowerName = `${asset.fileName ?? ""} ${asset.uri}`.toLocaleLowerCase();
  if (lowerName.includes(".jpg") || lowerName.includes(".jpeg")) {
    return "image/jpeg";
  }
  if (lowerName.includes(".png")) {
    return "image/png";
  }
  if (lowerName.includes(".webp")) {
    return "image/webp";
  }
  return null;
}

function stablePageId(asset: PickedGalleryAsset, pageIndex: number) {
  return sanitizeFileName(asset.assetId ?? asset.fileName ?? asset.uri) || `page-${pageIndex + 1}`;
}

function uniqueLocalFileName(page: SelectedCoursePage) {
  const extension = extensionFromMimeType(page.mimeType);
  return `${String(page.pageIndex + 1).padStart(2, "0")}-${page.id}.${extension}`;
}

export function prepareSelectedCoursePages(assets: PickedGalleryAsset[]): SelectedCoursePage[] {
  if (assets.length === 0) {
    throw new GalleryImportError("empty_selection", "Sélectionne au moins une image.");
  }
  if (assets.length > MAX_GALLERY_COURSE_PAGES) {
    throw new GalleryImportError("too_many_images", `Sélectionne au maximum ${MAX_GALLERY_COURSE_PAGES} images.`);
  }

  return assets.map((asset, pageIndex) => {
    const mimeType = inferMimeType(asset);
    if (!mimeType) {
      throw new GalleryImportError("unsupported_format", "Seuls les formats JPG, PNG et WebP sont acceptés.");
    }

    const baseName = sanitizeFileName(asset.fileName ?? asset.assetId ?? `page-${pageIndex + 1}`) || `page-${pageIndex + 1}`;
    const id = `${pageIndex}-${stablePageId(asset, pageIndex)}`;

    return {
      id,
      sourceUri: asset.uri,
      mimeType,
      pageIndex,
      fileName: baseName,
      width: asset.width ?? null,
      height: asset.height ?? null,
    };
  });
}

export function normalizeSelectedCoursePages(pages: SelectedCoursePage[]): SelectedCoursePage[] {
  return pages.map((page, pageIndex) => ({ ...page, pageIndex }));
}

export function moveSelectedCoursePage(pages: SelectedCoursePage[], id: string, direction: "left" | "right") {
  const index = pages.findIndex((page) => page.id === id);
  const nextIndex = direction === "left" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= pages.length) {
    return pages;
  }

  const nextPages = [...pages];
  const current = nextPages[index];
  nextPages[index] = nextPages[nextIndex];
  nextPages[nextIndex] = current;
  return normalizeSelectedCoursePages(nextPages);
}

export function removeSelectedCoursePage(pages: SelectedCoursePage[], id: string) {
  return normalizeSelectedCoursePages(pages.filter((page) => page.id !== id));
}

export function createGalleryImportService(deps: {
  picker: GalleryPickerGateway;
  files: GalleryFileGateway;
  courses: GalleryCourseGateway;
}) {
  return {
    pickPages: async (): Promise<PickGalleryImagesResult> => {
      const result = await deps.picker.pickImages();
      if (result.status === "cancelled") {
        return { status: "cancelled" };
      }
      return { status: "selected", pages: prepareSelectedCoursePages(result.assets) };
    },
    createCourse: async (input: CreateGalleryCourseInput): Promise<GalleryCourseCreationResult> => {
      const normalizedTitle = normalizeTitle(input.title);
      const normalizedGrade = normalizeTitle(input.grade);
      if (!normalizedTitle) {
        throw new GalleryImportError("course_creation_failed", "Renseigne un titre de cours.");
      }
      if (!normalizedGrade) {
        throw new GalleryImportError("course_creation_failed", "Renseigne une classe.");
      }

      const directoryUri = await deps.files.createImportDirectory();
      const copiedPages: ImportPageInput[] = [];
      const copiedFileUris: string[] = [];

      try {
        for (const page of normalizeSelectedCoursePages(input.pages)) {
          const localUri = await deps.files.copyToDirectory(page.sourceUri, directoryUri, uniqueLocalFileName(page));
          copiedFileUris.push(localUri);
          copiedPages.push({ localUri, thumbnailUri: localUri, rotation: 0, qualityStatus: "good" });
        }

        const created = await deps.courses.createCourseFromPages({
          subjectId: input.subjectId,
          title: normalizedTitle,
          grade: normalizedGrade,
          pages: copiedPages,
        });
        return { ...created, copiedFileUris };
      } catch (error) {
        await deps.files.deleteFiles(copiedFileUris);
        if (error instanceof GalleryImportError) {
          throw error;
        }
        throw new GalleryImportError("course_creation_failed", "Impossible de créer le cours avec ces pages.");
      }
    },
  };
}
