// Replaces every photo in an album with an already-exported set of web photos:
// a folder holding photos.json, full/<id>.webp (2000px) and thumb/<id>.webp
// (400px). The files go up as they are, with no converting.
//
// Every photo uploads first. The album only switches over once all of them
// made it, and only then are the old photos deleted. If any photo fails, the
// new uploads are removed and the album is left as it was.
//
// Usage: bun scripts/replace-album-photos.ts <web-folder> <album-slug>
// (reads .env.local; uses the `photobook` AWS profile)

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { deletePhotoFiles, readAlbum, saveAlbum } from "@/lib/albums/album-store";
import type { Photo, PhotoSize } from "@/lib/albums/album-types";
import { PHOTO_FILE_EXTENSION } from "@/lib/constants";
import { buildPhotoKey } from "@/lib/storage/object-keys";
import { putPhotoObject } from "@/lib/storage/object-store";
import { mapWithConcurrency } from "@/lib/utils/concurrency";

/** One entry in photos.json. `taken` is local camera time with hundredths, like "2026-06-27T10:33:54.00". */
type ExportedPhoto = { id: string; taken: string | null; width: number; height: number };

const PARALLEL_PHOTOS = 8;
const PROGRESS_EVERY = 50;
// The app stores camera time to the second, like "2026-06-27T10:33:54".
const TAKEN_AT_LENGTH = 19;
const SIZE_FOLDERS: Record<PhotoSize, string> = { thumb: "thumb", full: "full" };

const [folder, albumSlug] = process.argv.slice(2);
if (!folder || !albumSlug) throw new Error("Usage: bun scripts/replace-album-photos.ts <web-folder> <album-slug>");

const uploadPhoto = async (exported: ExportedPhoto): Promise<Photo> => {
  const photoId = randomUUID();
  const sizes = Object.keys(SIZE_FOLDERS) as PhotoSize[];
  try {
    await Promise.all(
      sizes.map(async (size) => {
        const file = await readFile(join(folder, SIZE_FOLDERS[size], `${exported.id}.${PHOTO_FILE_EXTENSION}`));
        await putPhotoObject(buildPhotoKey(photoId, size), file);
      }),
    );
  } catch (error) {
    // One size can finish uploading before the other fails, so clear out whatever made it.
    await deletePhotoFiles([photoId]);
    throw error;
  }
  const takenAt = exported.taken ? exported.taken.slice(0, TAKEN_AT_LENGTH) : null;
  return { id: photoId, width: exported.width, height: exported.height, takenAt, caption: "" };
};

const stored = await readAlbum(albumSlug);
if (!stored) throw new Error(`No album "${albumSlug}"`);

// photos.json already lists the photos in the order they were taken.
const { photos: exportedPhotos } = JSON.parse(await readFile(join(folder, "photos.json"), "utf8")) as {
  photos: ExportedPhoto[];
};
console.log(`Uploading ${exportedPhotos.length} photos to "${stored.value.title}"...`);

let finishedCount = 0;
const failures: string[] = [];
const results = await mapWithConcurrency(exportedPhotos, PARALLEL_PHOTOS, async (exported) => {
  try {
    return await uploadPhoto(exported);
  } catch (error) {
    failures.push(`${exported.id}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  } finally {
    finishedCount += 1;
    if (finishedCount % PROGRESS_EVERY === 0 || finishedCount === exportedPhotos.length) {
      console.log(`  ${finishedCount} / ${exportedPhotos.length}`);
    }
  }
});
const newPhotos = results.filter((photo): photo is Photo => photo !== null);

if (failures.length > 0) {
  console.error(`${failures.length} photos failed, so the album was left as it was:`);
  failures.forEach((failure) => console.error(`  ${failure}`));
  await deletePhotoFiles(newPhotos.map((photo) => photo.id));
  console.error("Removed the photos that did upload.");
  process.exit(1);
}

// Read again right before saving, so the save only goes through if nobody changed the album meanwhile.
const latest = await readAlbum(albumSlug);
if (!latest) throw new Error(`Album "${albumSlug}" disappeared during the upload`);
const oldPhotoIds = latest.value.photos.map((photo) => photo.id);

await saveAlbum({ ...latest.value, photos: newPhotos, updatedAt: new Date().toISOString() }, latest.etag);
await deletePhotoFiles(oldPhotoIds);
console.log(`Done: "${latest.value.title}" now has ${newPhotos.length} photos. Removed ${oldPhotoIds.length} old ones.`);
