import exifr from "exifr";
import type { Photo, PhotoSize } from "@/lib/albums/album-types";
import { PHOTO_CONTENT_TYPE, PHOTO_SIZES } from "@/lib/constants";
import { type Dimensions, fitWithinEdge } from "@/lib/photos/photo-dimensions";
import { formatLocalDateTime } from "@/lib/photos/taken-at";
import type { PhotoUpload } from "@/app/edit/actions";

type RenderedSize = { blob: Blob; dimensions: Dimensions };

const renderWebp = async (bitmap: ImageBitmap, size: PhotoSize): Promise<RenderedSize> => {
  const { maxEdgePx, quality } = PHOTO_SIZES[size];
  const dimensions = fitWithinEdge({ width: bitmap.width, height: bitmap.height }, maxEdgePx);
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Couldn't draw the photo");
  context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, PHOTO_CONTENT_TYPE, quality));
  // Some browsers quietly hand back a PNG when they can't make WebP.
  const isWebp = blob?.type === PHOTO_CONTENT_TYPE;
  if (!blob || !isWebp) throw new Error("This browser can't make WebP images. Try Chrome.");
  return { blob, dimensions };
};

const readTakenAt = async (file: File): Promise<string | null> => {
  try {
    const exif = (await exifr.parse(file, { pick: ["DateTimeOriginal"] })) as { DateTimeOriginal?: unknown } | undefined;
    return exif?.DateTimeOriginal instanceof Date ? formatLocalDateTime(exif.DateTimeOriginal) : null;
  } catch {
    // Formats exifr can't read (like WebP) just mean there's no date to use.
    return null;
  }
};

const putBlob = async (url: string, blob: Blob): Promise<void> => {
  const response = await fetch(url, { method: "PUT", body: blob, headers: { "Content-Type": PHOTO_CONTENT_TYPE } });
  if (!response.ok) throw new Error(`Upload failed (${response.status})`);
};

/** Makes the web-size copies in the browser and uploads them straight to storage. The original never leaves the device. */
export const prepareAndUploadPhoto = async (
  file: File,
  requestUpload: () => Promise<PhotoUpload>,
): Promise<Photo> => {
  // Browsers apply the camera's rotation tag when decoding, so portrait photos come out upright.
  const [bitmap, takenAt, upload] = await Promise.all([createImageBitmap(file), readTakenAt(file), requestUpload()]);
  const [thumb, full] = await Promise.all([renderWebp(bitmap, "thumb"), renderWebp(bitmap, "full")]);
  bitmap.close();

  await Promise.all([putBlob(upload.uploadUrls.thumb, thumb.blob), putBlob(upload.uploadUrls.full, full.blob)]);
  return { id: upload.photoId, ...full.dimensions, takenAt, caption: "" };
};
