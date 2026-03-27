import { File, Paths } from "expo-file-system/next";
import { Platform } from "react-native";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
  uploadString,
} from "firebase/storage";

import { firebaseApp } from "./firebase";

const storage = firebaseApp ? getStorage(firebaseApp) : null;

async function uploadBase64Native(
  storageRef: ReturnType<typeof ref>,
  base64: string,
  contentType: string
) {
  const file = new File(Paths.cache, `upload_${Date.now()}.tmp`);

  try {
    file.write(base64, { encoding: "base64" });

    const response = await fetch(file.uri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob, { contentType });
  } finally {
    try { file.delete(); } catch {}
  }
}

function ensureStorage() {
  if (!storage) {
    throw new Error("Firebase Storage is not configured.");
  }

  return storage;
}

function inferExtension(uri: string, mimeType: string | null) {
  const extensionFromMime = mimeType?.split("/").pop()?.trim().toLowerCase();

  if (extensionFromMime) {
    return extensionFromMime === "jpeg" ? "jpg" : extensionFromMime;
  }

  const extensionFromUri = uri.split(".").pop()?.trim().toLowerCase();

  if (extensionFromUri && extensionFromUri.length <= 5) {
    return extensionFromUri === "jpeg" ? "jpg" : extensionFromUri;
  }

  return "jpg";
}

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "listing";
}

export async function uploadListingImage(input: {
  base64: string;
  mimeType: string | null;
  sellerId: string;
  uri: string;
}) {
  const firebaseStorage = ensureStorage();
  const extension = inferExtension(input.uri, input.mimeType);
  const storagePath = `listings/${sanitizeSegment(input.sellerId)}/${Date.now()}.${extension}`;
  const storageRef = ref(firebaseStorage, storagePath);

  const contentType = input.mimeType ?? `image/${extension}`;

  if (Platform.OS === "web") {
    await uploadString(storageRef, input.base64, "base64", { contentType });
  } else {
    await uploadBase64Native(storageRef, input.base64, contentType);
  }

  return {
    imagePath: storagePath,
    imageUrl: await getDownloadURL(storageRef),
  };
}

export async function deleteListingImage(imagePath: string | null | undefined) {
  if (!imagePath) {
    return;
  }

  const firebaseStorage = ensureStorage();

  try {
    await deleteObject(ref(firebaseStorage, imagePath));
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      typeof error.code === "string" &&
      error.code.includes("object-not-found")
    ) {
      return;
    }

    throw error;
  }
}
