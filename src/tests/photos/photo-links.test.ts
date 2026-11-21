import { describe, expect, test } from "bun:test";
import { buildPhotoPath, isValidPhotoLink, type PhotoLink } from "@/lib/photos/photo-links";

const SECRET = "test-secret-that-is-long-enough-to-use";
const NOW_SECONDS = 1_800_000_000;
const LINK: PhotoLink = { photoId: "7a35d8ab-308d-4757-ba0e-010d842a7dee", size: "thumb", expiresAtSeconds: NOW_SECONDS + 60 };

const readSignature = (path: string): string => new URL(path, "http://localhost").searchParams.get("signature")!;

describe("photo links", () => {
  test("are short paths to the photo route", () => {
    const path = buildPhotoPath(SECRET, LINK);
    expect(path.startsWith(`/photos/${LINK.photoId}/thumb?expires=${LINK.expiresAtSeconds}&signature=`)).toBe(true);
    expect(path.length).toBeLessThan(160);
  });

  test("check out with the right secret before they expire", () => {
    expect(isValidPhotoLink(SECRET, LINK, readSignature(buildPhotoPath(SECRET, LINK)), NOW_SECONDS)).toBe(true);
  });

  test("fail once expired", () => {
    const signature = readSignature(buildPhotoPath(SECRET, LINK));
    expect(isValidPhotoLink(SECRET, LINK, signature, LINK.expiresAtSeconds)).toBe(false);
  });

  test("fail when any part is changed", () => {
    const signature = readSignature(buildPhotoPath(SECRET, LINK));
    expect(isValidPhotoLink(SECRET, { ...LINK, size: "full" }, signature, NOW_SECONDS)).toBe(false);
    expect(isValidPhotoLink(SECRET, { ...LINK, expiresAtSeconds: LINK.expiresAtSeconds + 3600 }, signature, NOW_SECONDS)).toBe(false);
    expect(isValidPhotoLink(SECRET, { ...LINK, photoId: "5c6c78fd-8f17-4702-a4e7-570bca31c638" }, signature, NOW_SECONDS)).toBe(false);
    expect(isValidPhotoLink("another-secret", LINK, signature, NOW_SECONDS)).toBe(false);
    expect(isValidPhotoLink(SECRET, LINK, "made-up", NOW_SECONDS)).toBe(false);
  });
});
