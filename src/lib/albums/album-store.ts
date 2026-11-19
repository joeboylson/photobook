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

export const readAlbum = (slug: string): Promise<StoredJson<Album> | null> =>
  readJsonObject<Album>(buildAlbumKey(slug));

export const listAlbums = async (): Promise<Album[]> => {
  const keys = await listObjectKeys(ALBUMS_PREFIX);
  const slugs = keys.map(parseAlbumSlugFromKey).filter((slug): slug is string => slug !== null);
  const storedAlbums = await Promise.all(slugs.map(readAlbum));
  return storedAlbums
    .filter((stored): stored is StoredJson<Album> => stored !== null)
    .map((stored) => stored.value)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
};

export const listAlbumSummaries = async (): Promise<AlbumSummary[]> => (await listAlbums()).map(summarizeAlbum);

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
