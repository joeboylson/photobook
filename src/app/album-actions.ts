"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseAlbumForm } from "@/lib/albums/album-form";
import {
  addPhotosToAlbum,
  applyAlbumSettings,
  createEmptyAlbum,
  removePhotoFromAlbum,
  reorderAlbumPhotos,
  setAlbumCover,
} from "@/lib/albums/album-rules";
import {
  createAlbum,
  deleteAlbumAndPhotos,
  deletePhotoFiles,
  readAlbum,
  saveAlbum,
} from "@/lib/albums/album-store";
import type { Photo, PhotoSize } from "@/lib/albums/album-types";
import { hashPassword } from "@/lib/auth/password";
import { PHOTO_ID_PATTERN } from "@/lib/constants";
import { requireEditor } from "@/lib/auth/session";
import { buildPhotoKey } from "@/lib/storage/object-keys";
import { isWriteConflict, signPhotoUploadUrl } from "@/lib/storage/object-store";

export type FormResult = { error: string | null; savedAt: number | null };


const nowIso = () => new Date().toISOString();

const readAlbumOrThrow = async (slug: string) => {
  const stored = await readAlbum(slug);
  if (!stored) throw new Error(`Album "${slug}" not found`);
  return stored;
};

const refreshAllPages = () => revalidatePath("/", "layout");

export async function createAlbumAction(_previous: FormResult, formData: FormData): Promise<FormResult> {
  await requireEditor();
  const parsed = parseAlbumForm(formData, false);
  if (parsed.error !== null) return { error: parsed.error, savedAt: null };

  const { title, month, access, newPassword } = parsed.form;
  const passwordHash = newPassword ? hashPassword(newPassword) : null;
  const album = createEmptyAlbum(title, { month, access, passwordHash }, nowIso());

  try {
    await createAlbum(album);
  } catch (error) {
    if (isWriteConflict(error)) return { error: "An album with that name already exists", savedAt: null };
    throw error;
  }

  refreshAllPages();
  redirect(`/albums/${album.slug}`);
}

export async function updateAlbumSettingsAction(
  slug: string,
  _previous: FormResult,
  formData: FormData,
): Promise<FormResult> {
  await requireEditor();
  const { value: album, etag } = await readAlbumOrThrow(slug);
  const parsed = parseAlbumForm(formData, Boolean(album.passwordHash));
  if (parsed.error !== null) return { error: parsed.error, savedAt: null };

  const { title, month, access, newPassword } = parsed.form;
  const passwordHash = newPassword ? hashPassword(newPassword) : album.passwordHash;
  await saveAlbum(applyAlbumSettings(album, { title, month, access, passwordHash }, nowIso()), etag);

  refreshAllPages();
  return { error: null, savedAt: Date.now() };
}

export type PhotoUpload = { photoId: string; uploadUrls: Record<PhotoSize, string> };

export async function requestPhotoUploadAction(slug: string): Promise<PhotoUpload> {
  await requireEditor();
  await readAlbumOrThrow(slug);

  const photoId = randomUUID();
  const [thumb, full] = await Promise.all([
    signPhotoUploadUrl(buildPhotoKey(photoId, "thumb")),
    signPhotoUploadUrl(buildPhotoKey(photoId, "full")),
  ]);
  return { photoId, uploadUrls: { thumb, full } };
}

const isValidNewPhoto = (photo: Photo): boolean =>
  PHOTO_ID_PATTERN.test(photo.id) &&
  Number.isInteger(photo.width) &&
  photo.width > 0 &&
  Number.isInteger(photo.height) &&
  photo.height > 0 &&
  (photo.takenAt === null || typeof photo.takenAt === "string");

export async function addPhotosAction(slug: string, photos: Photo[]): Promise<void> {
  await requireEditor();
  if (!photos.every(isValidNewPhoto)) throw new Error("Photo details didn't match the expected shape");

  const { value: album, etag } = await readAlbumOrThrow(slug);
  const cleanPhotos = photos.map(({ id, width, height, takenAt }) => ({ id, width, height, takenAt, caption: "" }));
  await saveAlbum(addPhotosToAlbum(album, cleanPhotos, nowIso()), etag);
  refreshAllPages();
}

export async function removePhotoAction(slug: string, photoId: string): Promise<void> {
  await requireEditor();
  const { value: album, etag } = await readAlbumOrThrow(slug);
  await saveAlbum(removePhotoFromAlbum(album, photoId, nowIso()), etag);
  await deletePhotoFiles([photoId]);
  refreshAllPages();
}

export async function reorderPhotosAction(slug: string, orderedPhotoIds: string[]): Promise<void> {
  await requireEditor();
  const { value: album, etag } = await readAlbumOrThrow(slug);
  await saveAlbum(reorderAlbumPhotos(album, orderedPhotoIds, nowIso()), etag);
  refreshAllPages();
}

export async function setCoverPhotoAction(slug: string, photoId: string): Promise<void> {
  await requireEditor();
  const { value: album, etag } = await readAlbumOrThrow(slug);
  await saveAlbum(setAlbumCover(album, photoId, nowIso()), etag);
  refreshAllPages();
}

export async function deleteAlbumAction(slug: string): Promise<void> {
  await requireEditor();
  const { value: album } = await readAlbumOrThrow(slug);
  await deleteAlbumAndPhotos(album);
  refreshAllPages();
  redirect("/");
}
