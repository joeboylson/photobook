// Fills the bucket with test albums of solid-color photos: one per access level,
// plus a 10-photo album of grays, dark to light, for trying reordering across
// rows. Albums that already exist are left alone.
//
// Usage: bun run seed
// (reads .env.local; uses the `photobook` AWS profile)

import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { addPhotosToAlbum, createEmptyAlbum, slugifyTitle } from "@/lib/albums/album-rules";
import { createAlbum, readAlbum } from "@/lib/albums/album-store";
import type { AlbumAccess, Photo, PhotoSize } from "@/lib/albums/album-types";
import { hashPassword } from "@/lib/auth/password";
import { PHOTO_SIZES } from "@/lib/constants";
import { fitWithinEdge } from "@/lib/photos/photo-dimensions";
import { buildPhotoKey } from "@/lib/storage/object-keys";
import { isWriteConflict, putPhotoObject } from "@/lib/storage/object-store";

const LANDSCAPE = { width: 3000, height: 2000 };
const PORTRAIT = { width: 2000, height: 3000 };
const QUALITY_PERCENT = 100;
const FIRST_TAKEN_AT_MS = Date.UTC(2026, 5, 27, 14, 0, 0);
const MINUTES_BETWEEN_PHOTOS = 7;
const MS_PER_MINUTE = 60_000;
const TEST_PASSWORD = "wedding";

type TestAlbum = { title: string; month: string; access: AlbumAccess; colors: string[] };

const TEST_ALBUMS: TestAlbum[] = [
  { title: "Around Town", month: "2026-08", access: "public", colors: ["#e4572e", "#f3a712", "#a8c686", "#669bbc"] },
  { title: "Wedding", month: "2026-06", access: "password", colors: ["#f4e9e1", "#c9ada7", "#9a8c98"] },
  { title: "Honeymoon", month: "2026-07", access: "private", colors: ["#2a9d8f", "#264653", "#e9c46a"] },
  {
    title: "Shades of Gray",
    month: "2025-11",
    access: "public",
    colors: ["#111111", "#2b2b2b", "#454545", "#5f5f5f", "#797979", "#939393", "#adadad", "#c7c7c7", "#e1e1e1", "#f5f5f5"],
  },
];

const describeTakenAt = (photoNumber: number): string =>
  new Date(FIRST_TAKEN_AT_MS + photoNumber * MINUTES_BETWEEN_PHOTOS * MS_PER_MINUTE).toISOString().slice(0, 19);

const uploadSolidColorPhoto = async (color: string, photoNumber: number): Promise<Photo> => {
  const photoId = randomUUID();
  const original = photoNumber % 3 === 2 ? PORTRAIT : LANDSCAPE;
  const sizeNames = Object.keys(PHOTO_SIZES) as PhotoSize[];

  const uploads = sizeNames.map(async (size) => {
    const { width, height } = fitWithinEdge(original, PHOTO_SIZES[size].maxEdgePx);
    const image = await sharp({ create: { width, height, channels: 3, background: color } })
      .webp({ quality: QUALITY_PERCENT })
      .toBuffer();
    await putPhotoObject(buildPhotoKey(photoId, size), image);
    return { size, width, height };
  });
  const full = (await Promise.all(uploads)).find((upload) => upload.size === "full")!;

  return { id: photoId, width: full.width, height: full.height, takenAt: describeTakenAt(photoNumber), caption: color };
};

const seedAlbum = async ({ title, month, access, colors }: TestAlbum): Promise<void> => {
  // Checked before uploading, so re-running doesn't leave unused photo files behind.
  if (await readAlbum(slugifyTitle(title))) {
    console.log(`"${title}" already exists, skipped`);
    return;
  }

  const now = new Date().toISOString();
  const passwordHash = access === "password" ? hashPassword(TEST_PASSWORD) : null;
  const photos = await Promise.all(colors.map(uploadSolidColorPhoto));
  const album = addPhotosToAlbum(createEmptyAlbum(title, { month, access, passwordHash }, now), photos, now);

  try {
    await createAlbum(album);
    console.log(`Created "${title}" (${access}, ${photos.length} photos)`);
  } catch (error) {
    if (!isWriteConflict(error)) throw error;
    console.log(`"${title}" already exists, skipped`);
  }
};

await Promise.all(TEST_ALBUMS.map(seedAlbum));
console.log(`Password album password: ${TEST_PASSWORD}`);
