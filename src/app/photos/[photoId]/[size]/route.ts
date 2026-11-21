import { NextResponse } from "next/server";
import type { PhotoSize } from "@/lib/albums/album-types";
import { MS_PER_SECOND, PHOTO_ID_PATTERN, PHOTO_SIZES } from "@/lib/constants";
import { readAuthEnv } from "@/lib/env";
import { isValidPhotoLink } from "@/lib/photos/photo-links";
import { buildPhotoKey } from "@/lib/storage/object-keys";
import { getCurrentSigningDate, signDownloadUrl } from "@/lib/storage/object-store";

const HTTP_NOT_FOUND = 404;

const isPhotoSize = (value: string): value is PhotoSize => Object.hasOwn(PHOTO_SIZES, value);

/**
 * Checks a photo link made by buildPhotoPath and sends the browser on to the
 * photo in S3. The link's signature is the only check, so this never reads the
 * album or the session. A bad or expired link looks the same as a missing photo.
 */
export async function GET(request: Request, { params }: { params: Promise<{ photoId: string; size: string }> }) {
  const { photoId, size } = await params;
  const searchParams = new URL(request.url).searchParams;
  const expiresAtSeconds = Number(searchParams.get("expires"));
  const signature = searchParams.get("signature") ?? "";
  const nowMs = Date.now();
  const nowSeconds = Math.floor(nowMs / MS_PER_SECOND);

  const isWellFormed = PHOTO_ID_PATTERN.test(photoId) && isPhotoSize(size) && Number.isInteger(expiresAtSeconds);
  if (!isWellFormed) return new NextResponse(null, { status: HTTP_NOT_FOUND });

  const link = { photoId, size, expiresAtSeconds };
  if (!isValidPhotoLink(readAuthEnv().sessionSecret, link, signature, nowSeconds)) {
    return new NextResponse(null, { status: HTTP_NOT_FOUND });
  }

  const s3Url = await signDownloadUrl(buildPhotoKey(photoId, size), getCurrentSigningDate(nowMs));
  const response = NextResponse.redirect(s3Url);
  // The browser can reuse this hop until the photo link expires. The S3 link is
  // signed from the current hour, so it lasts at least that long.
  response.headers.set("Cache-Control", `private, max-age=${expiresAtSeconds - nowSeconds}`);
  return response;
}
