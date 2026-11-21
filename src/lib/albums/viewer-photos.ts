import { readAuthEnv } from "@/lib/env";
import { MS_PER_SECOND, PHOTO_FILE_EXTENSION, SIGNED_URL_LIFETIME_SECONDS } from "@/lib/constants";
import { buildPhotoPath } from "@/lib/photos/photo-links";
import { buildPhotoKey } from "@/lib/storage/object-keys";
import { getCurrentSigningDate, signDownloadUrl } from "@/lib/storage/object-store";
import type { Photo, PhotoSize, ViewerPhoto } from "./album-types";

// Links are made from the start of the current hour, so every page load in that
// hour gets the same links and the browser can reuse what it already loaded.
const buildCurrentPhotoPath = (photoId: string, size: PhotoSize): string => {
  const signingDate = getCurrentSigningDate(Date.now());
  const expiresAtSeconds = Math.floor(signingDate.getTime() / MS_PER_SECOND) + SIGNED_URL_LIFETIME_SECONDS;
  return buildPhotoPath(readAuthEnv().sessionSecret, { photoId, size, expiresAtSeconds });
};

/** Only call this after the viewer has been allowed into the album: the links open the photos for anyone holding them. */
export const signViewerPhotos = (photos: Photo[]): ViewerPhoto[] =>
  photos.map((photo) => ({
    ...photo,
    thumbUrl: buildCurrentPhotoPath(photo.id, "thumb"),
    fullUrl: buildCurrentPhotoPath(photo.id, "full"),
  }));

export const signCoverUrl = (coverPhotoId: string | null): string | null =>
  coverPhotoId ? buildCurrentPhotoPath(coverPhotoId, "thumb") : null;

/**
 * A link that makes the browser save the full-size photo, named like
 * "wedding-3.webp" after the album and the photo's place in it. Signed one at a
 * time when someone clicks download. Same rule as above: only after the viewer was let in.
 */
export const signPhotoDownloadUrl = (albumSlug: string, photoId: string, position: number): Promise<string> => {
  const fileName = `${albumSlug}-${position}.${PHOTO_FILE_EXTENSION}`;
  return signDownloadUrl(buildPhotoKey(photoId, "full"), getCurrentSigningDate(Date.now()), fileName);
};
