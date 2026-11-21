import { createHmac, timingSafeEqual } from "node:crypto";
import type { PhotoSize } from "@/lib/albums/album-types";
import { PHOTO_ROUTE_PREFIX } from "@/lib/constants";

/**
 * Pages link to photos as /photos/<id>/<size>?expires=…&signature=…, about 130
 * characters. A signed S3 link runs 600 to 2,700 characters, and an album page
 * with hundreds of photos sent megabytes of them. The photo route checks the
 * signature and forwards the browser to S3.
 *
 * Like an S3 link, a photo link opens the photo for anyone holding it until it
 * expires, so pages only make them after the viewer was let into the album.
 */
export type PhotoLink = { photoId: string; size: PhotoSize; expiresAtSeconds: number };

const signPhotoLink = (secret: string, { photoId, size, expiresAtSeconds }: PhotoLink): string =>
  createHmac("sha256", secret).update(`${photoId}/${size}/${expiresAtSeconds}`).digest("base64url");

export const buildPhotoPath = (secret: string, link: PhotoLink): string => {
  const query = new URLSearchParams({
    expires: String(link.expiresAtSeconds),
    signature: signPhotoLink(secret, link),
  });
  return `${PHOTO_ROUTE_PREFIX}/${link.photoId}/${link.size}?${query}`;
};

export const isValidPhotoLink = (secret: string, link: PhotoLink, signature: string, nowSeconds: number): boolean => {
  if (link.expiresAtSeconds <= nowSeconds) return false;
  const expected = Buffer.from(signPhotoLink(secret, link));
  const given = Buffer.from(signature);
  // Compared in constant time, so response timing can't reveal how much of a guess was right.
  return expected.length === given.length && timingSafeEqual(expected, given);
};
