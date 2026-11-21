import { cache } from "react";
import { ALBUMS_PREFIX, PHOTO_SIZES } from "@/lib/constants";
import { buildAlbumKey, buildPhotoKey, parseAlbumSlugFromKey } from "@/lib/storage/object-keys";
import {
  deleteObjects,
  listObjectKeys,
  readJsonObject,
  type StoredJson,
  writeJsonObject,
} from "@/lib/storage/object-store";
import { summarizeAlbum } from "./album-rules";
import type { Album, AlbumSummary, PhotoSize } from "./album-types";

const PHOTO_SIZE_NAMES = Object.keys(PHOTO_SIZES) as PhotoSize[];

export const listPhotoObjectKeys = (photoId: string): string[] =>
  PHOTO_SIZE_NAMES.map((size) => buildPhotoKey(photoId, size));

// Albums saved before albums had months have no month field at all.
type SavedAlbum = Omit<Album, "month"> & { month?: string | null };

export const readAlbum = async (slug: string): Promise<StoredJson<Album> | null> => {
  const stored = await readJsonObject<SavedAlbum>(buildAlbumKey(slug));
  if (!stored) return null;
  return { ...stored, value: { ...stored.value, month: stored.value.month ?? null } };
};

export const listAlbums = async (): Promise<Album[]> => {
  const keys = await listObjectKeys(ALBUMS_PREFIX);
  const slugs = keys.map(parseAlbumSlugFromKey).filter((slug): slug is string => slug !== null);
  const storedAlbums = await Promise.all(slugs.map(readAlbum));
  return storedAlbums
    .filter((stored): stored is StoredJson<Album> => stored !== null)
    .map((stored) => stored.value)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
};

// Cached per request: the gallery sidebar and the home page both list albums.
export const listAlbumSummaries = cache(async (): Promise<AlbumSummary[]> => (await listAlbums()).map(summarizeAlbum));

export const createAlbum = (album: Album): Promise<void> =>
  writeJsonObject(buildAlbumKey(album.slug), album, { onlyIfNew: true });

export const saveAlbum = (album: Album, etag: string): Promise<void> =>
  writeJsonObject(buildAlbumKey(album.slug), album, { ifMatch: etag });

export const deletePhotoFiles = (photoIds: string[]): Promise<void> =>
  deleteObjects(photoIds.flatMap(listPhotoObjectKeys));

export const deleteAlbumAndPhotos = async (album: Album): Promise<void> => {
  await deletePhotoFiles(album.photos.map((photo) => photo.id));
  await deleteObjects([buildAlbumKey(album.slug)]);
};
