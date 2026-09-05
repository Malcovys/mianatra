import type { CoursePage } from "@/src/db";

const MAX_IMAGE_SIDE = 2048;
const JPEG_QUALITY = 0.8;

export type PreparedCoursePageImage = {
  pageId: string;
  pageIndex: number;
  imageBase64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  cleanup?: () => Promise<void>;
  metrics?: CoursePageImageMetrics;
};

export type CoursePageImageMetrics = {
  originalUri: string;
  optimizedUri: string;
  width: number | null;
  height: number | null;
  originalFileSizeBytes: number | null;
  optimizedFileSizeBytes: number | null;
  mimeType: PreparedCoursePageImage["mimeType"];
  base64Length: number;
  preparationDurationMs: number;
};

type ImageOptimizeResult = {
  uri: string;
  width: number | null;
  height: number | null;
  temporaryUris: string[];
};

export type CoursePageImageOptimizer = (input: {
  uri: string;
  maxSide: number;
  jpegQuality: number;
}) => Promise<ImageOptimizeResult>;

export type CoursePageImageFileGateway = {
  readAsBase64: (uri: string) => Promise<string>;
  getFileSize: (uri: string) => Promise<number | null>;
  deleteFiles: (uris: string[]) => Promise<void>;
};

export class CoursePageImageReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoursePageImageReadError";
  }
}

function parseDataUri(uri: string) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i.exec(uri.trim());
  if (!match) {
    return null;
  }
  return {
    mimeType: match[1].toLocaleLowerCase() as PreparedCoursePageImage["mimeType"],
    imageBase64: match[2],
  };
}

async function uriToBase64(uri: string, readAsBase64 = defaultReadAsBase64) {
  try {
    return await readAsBase64(uri);
  } catch {
    throw new CoursePageImageReadError("Impossible de lire le fichier local de cette page.");
  }
}

function nowMs() {
  return globalThis.performance?.now?.() ?? Date.now();
}

async function defaultReadAsBase64(uri: string) {
  if (!uri.trim()) {
    throw new CoursePageImageReadError("Le fichier local de cette page est introuvable.");
  }
  const FileSystem = await import("expo-file-system/legacy");
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

async function defaultGetFileSize(uri: string) {
  try {
    const FileSystem = await import("expo-file-system/legacy");
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && "size" in info && typeof info.size === "number" ? info.size : null;
  } catch {
    return null;
  }
}

async function defaultDeleteFiles(uris: string[]) {
  const FileSystem = await import("expo-file-system/legacy");
  await Promise.all(uris.map((uri) => FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined)));
}

function targetResize(width: number | null, height: number | null, maxSide = MAX_IMAGE_SIDE) {
  if (!width || !height) {
    return null;
  }
  const longest = Math.max(width, height);
  if (longest <= maxSide) {
    return null;
  }
  const ratio = maxSide / longest;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

async function defaultOptimizeImage(input: { uri: string; maxSide: number; jpegQuality: number }): Promise<ImageOptimizeResult> {
  const ImageManipulator = await import("expo-image-manipulator");
  const firstPass = await ImageManipulator.manipulateAsync(input.uri, [], {
    compress: input.jpegQuality,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  const resize = targetResize(firstPass.width, firstPass.height, input.maxSide);
  if (!resize) {
    return { uri: firstPass.uri, width: firstPass.width, height: firstPass.height, temporaryUris: [firstPass.uri] };
  }

  const resized = await ImageManipulator.manipulateAsync(input.uri, [{ resize }], {
    compress: input.jpegQuality,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return { uri: resized.uri, width: resized.width, height: resized.height, temporaryUris: [firstPass.uri, resized.uri] };
}

export async function prepareCoursePageImage(
  page: CoursePage,
  options: {
    readAsBase64?: (uri: string) => Promise<string>;
    fileGateway?: Partial<CoursePageImageFileGateway>;
    optimizeImage?: CoursePageImageOptimizer;
  } = {},
): Promise<PreparedCoursePageImage> {
  const dataUri = parseDataUri(page.localUri);
  if (dataUri) {
    return {
      pageId: page.id,
      pageIndex: page.pageIndex,
      ...dataUri,
    };
  }
  const startedAt = nowMs();
  const fileGateway: CoursePageImageFileGateway = {
    readAsBase64: options.readAsBase64 ?? options.fileGateway?.readAsBase64 ?? defaultReadAsBase64,
    getFileSize: options.fileGateway?.getFileSize ?? defaultGetFileSize,
    deleteFiles: options.fileGateway?.deleteFiles ?? defaultDeleteFiles,
  };
  const optimizeImage = options.optimizeImage ?? defaultOptimizeImage;
  const originalFileSizeBytes = await fileGateway.getFileSize(page.localUri);
  const optimized = await optimizeImage({ uri: page.localUri, maxSide: MAX_IMAGE_SIDE, jpegQuality: JPEG_QUALITY });
  const optimizedFileSizeBytes = await fileGateway.getFileSize(optimized.uri);
  const imageBase64 = await uriToBase64(optimized.uri, fileGateway.readAsBase64);
  const temporaryUris = [...new Set(optimized.temporaryUris.filter((uri) => uri !== page.localUri))];

  return {
    pageId: page.id,
    pageIndex: page.pageIndex,
    mimeType: "image/jpeg",
    imageBase64,
    cleanup: temporaryUris.length > 0 ? () => fileGateway.deleteFiles(temporaryUris) : undefined,
    metrics: {
      originalUri: page.localUri,
      optimizedUri: optimized.uri,
      width: optimized.width,
      height: optimized.height,
      originalFileSizeBytes,
      optimizedFileSizeBytes,
      mimeType: "image/jpeg",
      base64Length: imageBase64.length,
      preparationDurationMs: Math.round(nowMs() - startedAt),
    },
  };
}

export const coursePageImageSizing = { MAX_IMAGE_SIDE, JPEG_QUALITY, targetResize };
