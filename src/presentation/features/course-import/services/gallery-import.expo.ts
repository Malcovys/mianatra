import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { createCourseFromPages } from "./course-import.service";
import {
  GalleryImportError,
  MAX_GALLERY_COURSE_PAGES,
  createGalleryImportService,
  type GalleryFileGateway,
  type GalleryPickerGateway,
} from "./gallery-import.service";

function joinUri(directoryUri: string, fileName: string) {
  return `${directoryUri.replace(/\/+$/, "")}/${fileName}`;
}

function createImportId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const expoPickerGateway: GalleryPickerGateway = {
  pickImages: async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new GalleryImportError("permission_denied", "Autorise l’accès à la galerie pour importer tes pages.");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_GALLERY_COURSE_PAGES,
      quality: 1,
      base64: false,
      exif: false,
    });

    if (result.canceled) {
      return { status: "cancelled" };
    }

    return {
      status: "selected",
      assets: result.assets.map((asset) => ({
        uri: asset.uri,
        assetId: asset.assetId,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height,
      })),
    };
  },
};

const expoFileGateway: GalleryFileGateway = {
  createImportDirectory: async () => {
    if (!FileSystem.documentDirectory) {
      throw new GalleryImportError("local_copy_failed", "Le stockage local de l’application est indisponible.");
    }

    const directoryUri = joinUri(FileSystem.documentDirectory, `course-imports/${createImportId()}`);
    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
    return directoryUri;
  },
  copyToDirectory: async (sourceUri, directoryUri, fileName) => {
    const localUri = joinUri(directoryUri, fileName);
    try {
      await FileSystem.copyAsync({ from: sourceUri, to: localUri });
      return localUri;
    } catch {
      throw new GalleryImportError("local_copy_failed", "Impossible de copier une image dans le stockage local.");
    }
  },
  deleteFiles: async (uris) => {
    await Promise.all(
      uris.map((uri) => FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined)),
    );
  },
};

export const expoGalleryImportService = createGalleryImportService({
  picker: expoPickerGateway,
  files: expoFileGateway,
  courses: { createCourseFromPages },
});
