// Fills the bucket with three test albums of solid-color photos, one per access
// level. Albums that already exist are left alone.
//
// Usage: bun run seed
// (reads .env.local; uses the `photobook` AWS profile)

import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { addPhotosToAlbum, createEmptyAlbum } from "@/lib/albums/album-rules";
import { createAlbum } from "@/lib/albums/album-store";
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

type TestAlbum = { title: string; access: AlbumAccess; colors: string[] };

const TEST_ALBUMS: TestAlbum[] = [
  { title: "Around Town", access: "public", colors: ["#e4572e", "#f3a712", "#a8c686", "#669bbc"] },
  { title: "Wedding", access: "password", colors: ["#f4e9e1", "#c9ada7", "#9a8c98"] },
  { title: "Honeymoon", access: "private", colors: ["#2a9d8f", "#264653", "#e9c46a"] },
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

const seedAlbum = async ({ title, access, colors }: TestAlbum): Promise<void> => {
  const now = new Date().toISOString();
  const passwordHash = access === "password" ? hashPassword(TEST_PASSWORD) : null;
  const photos = await Promise.all(colors.map(uploadSolidColorPhoto));
  const album = addPhotosToAlbum(createEmptyAlbum(title, { access, passwordHash }, now), photos, now);

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
