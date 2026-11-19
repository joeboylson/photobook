import type { PhotoSize } from "@/lib/albums/album-types";
import { ALBUM_FILE_EXTENSION, ALBUMS_PREFIX, PHOTO_FILE_EXTENSION, PHOTOS_PREFIX } from "@/lib/constants";

export const buildAlbumKey = (slug: string): string => `${ALBUMS_PREFIX}${slug}${ALBUM_FILE_EXTENSION}`;

export const buildPhotoKey = (photoId: string, size: PhotoSize): string =>
  `${PHOTOS_PREFIX}${photoId}/${size}.${PHOTO_FILE_EXTENSION}`;

export const parseAlbumSlugFromKey = (key: string): string | null => {
  const isAlbumKey = key.startsWith(ALBUMS_PREFIX) && key.endsWith(ALBUM_FILE_EXTENSION);
  if (!isAlbumKey) return null;

  const slug = key.slice(ALBUMS_PREFIX.length, -ALBUM_FILE_EXTENSION.length);
  return slug || null;
};
