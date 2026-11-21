import { PHOTO_FILE_EXTENSION } from "@/lib/constants";
import { buildPhotoKey } from "@/lib/storage/object-keys";
import { getCurrentSigningDate, signDownloadUrl } from "@/lib/storage/object-store";
import type { Photo, ViewerPhoto } from "./album-types";

/** Only call this after the viewer has been allowed into the album: the links open the photos for anyone holding them. */
export const signViewerPhotos = (albumSlug: string, photos: Photo[]): Promise<ViewerPhoto[]> => {
  const signingDate = getCurrentSigningDate(Date.now());
  return Promise.all(
    photos.map(async (photo, index) => {
      const fullKey = buildPhotoKey(photo.id, "full");
      // Saved as "wedding-3.webp": the album and the photo's place in it.
      const downloadFileName = `${albumSlug}-${index + 1}.${PHOTO_FILE_EXTENSION}`;
      return {
        ...photo,
        thumbUrl: await signDownloadUrl(buildPhotoKey(photo.id, "thumb"), signingDate),
        fullUrl: await signDownloadUrl(fullKey, signingDate),
        downloadUrl: await signDownloadUrl(fullKey, signingDate, downloadFileName),
      };
    }),
  );
};

export const signCoverUrl = (coverPhotoId: string | null): Promise<string | null> => {
  if (!coverPhotoId) return Promise.resolve(null);
  return signDownloadUrl(buildPhotoKey(coverPhotoId, "thumb"), getCurrentSigningDate(Date.now()));
};
