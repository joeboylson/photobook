import { buildPhotoKey } from "@/lib/storage/object-keys";
import { getCurrentSigningDate, signDownloadUrl } from "@/lib/storage/object-store";
import type { Photo, ViewerPhoto } from "./album-types";

/** Only call this after the viewer has been allowed into the album: the links open the photos for anyone holding them. */
export const signViewerPhotos = (photos: Photo[]): Promise<ViewerPhoto[]> => {
  const signingDate = getCurrentSigningDate(Date.now());
  return Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      thumbUrl: await signDownloadUrl(buildPhotoKey(photo.id, "thumb"), signingDate),
      fullUrl: await signDownloadUrl(buildPhotoKey(photo.id, "full"), signingDate),
    })),
  );
};

export const signCoverUrl = (coverPhotoId: string | null): Promise<string | null> => {
  if (!coverPhotoId) return Promise.resolve(null);
  return signDownloadUrl(buildPhotoKey(coverPhotoId, "thumb"), getCurrentSigningDate(Date.now()));
};
