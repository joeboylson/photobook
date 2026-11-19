"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseAlbumForm } from "@/lib/albums/album-form";
import { addPhotosToAlbum, applyAlbumSettings, createEmptyAlbum, removePhotoFromAlbum } from "@/lib/albums/album-rules";
import {
  createAlbum,
  deleteAlbumAndPhotos,
  deletePhotoFiles,
  readAlbum,
  saveAlbum,
} from "@/lib/albums/album-store";
import type { Photo, PhotoSize } from "@/lib/albums/album-types";
import { hashPassword } from "@/lib/auth/password";
import { getSession, requireEditor } from "@/lib/auth/session";
import { buildPhotoKey } from "@/lib/storage/object-keys";
import { isWriteConflict, signPhotoUploadUrl } from "@/lib/storage/object-store";

export type FormResult = { error: string | null; savedAt: number | null };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const nowIso = () => new Date().toISOString();

const readAlbumOrThrow = async (slug: string) => {
  const stored = await readAlbum(slug);
  if (!stored) throw new Error(`Album "${slug}" not found`);
  return stored;
};

const refreshAlbumPages = (slug: string) => {
  revalidatePath("/", "layout");
  revalidatePath(`/edit/albums/${slug}`);
};

export async function createAlbumAction(_previous: FormResult, formData: FormData): Promise<FormResult> {
  await requireEditor();
  const parsed = parseAlbumForm(formData, false);
  if (parsed.error !== null) return { error: parsed.error, savedAt: null };

  const { title, access, newPassword } = parsed.form;
  const passwordHash = newPassword ? hashPassword(newPassword) : null;
  const album = createEmptyAlbum(title, { access, passwordHash }, nowIso());

  try {
    await createAlbum(album);
  } catch (error) {
    if (isWriteConflict(error)) return { error: "An album with that name already exists", savedAt: null };
    throw error;
  }

  revalidatePath("/", "layout");
  redirect(`/edit/albums/${album.slug}`);
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

  const { title, access, newPassword } = parsed.form;
  const passwordHash = newPassword ? hashPassword(newPassword) : album.passwordHash;
  await saveAlbum(applyAlbumSettings(album, { title, access, passwordHash }, nowIso()), etag);

  refreshAlbumPages(slug);
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
  UUID_PATTERN.test(photo.id) &&
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
  refreshAlbumPages(slug);
}

export async function removePhotoAction(slug: string, photoId: string): Promise<void> {
  await requireEditor();
  const { value: album, etag } = await readAlbumOrThrow(slug);
  await saveAlbum(removePhotoFromAlbum(album, photoId, nowIso()), etag);
  await deletePhotoFiles([photoId]);
  refreshAlbumPages(slug);
}

export async function deleteAlbumAction(slug: string): Promise<void> {
  await requireEditor();
  const { value: album } = await readAlbumOrThrow(slug);
  await deleteAlbumAndPhotos(album);
  revalidatePath("/", "layout");
  redirect("/edit");
}

export async function signOutAction(): Promise<void> {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
