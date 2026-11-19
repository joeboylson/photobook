"use client";

import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { addPhotosAction, requestPhotoUploadAction } from "@/app/edit/actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Photo } from "@/lib/albums/album-types";
import { UPLOAD_CONCURRENCY, UPLOAD_SAVE_BATCH_SIZE } from "@/lib/constants";
import { chunkList, mapWithConcurrency } from "@/lib/utils/concurrency";
import { prepareAndUploadPhoto } from "./prepare-photo";

type Progress = { done: number; total: number };

const describeError = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export function PhotoUploader({ slug }: { slug: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  const uploadOne = async (file: File): Promise<Photo | null> => {
    try {
      return await prepareAndUploadPhoto(file, () => requestPhotoUploadAction(slug));
    } catch (error) {
      // One bad file shouldn't stop the rest; it's reported and skipped.
      toast.error(`${file.name}: ${describeError(error)}`);
      return null;
    } finally {
      setProgress((current) => current && { ...current, done: current.done + 1 });
    }
  };

  const uploadFiles = async (files: File[]) => {
    setProgress({ done: 0, total: files.length });
    try {
      await chunkList(files, UPLOAD_SAVE_BATCH_SIZE).reduce(async (previousBatch, batch) => {
        await previousBatch;
        const uploaded = await mapWithConcurrency(batch, UPLOAD_CONCURRENCY, uploadOne);
        const photos = uploaded.filter((photo): photo is Photo => photo !== null);
        if (photos.length > 0) await addPhotosAction(slug, photos);
      }, Promise.resolve());
    } finally {
      setProgress(null);
    }
  };

  const isUploading = progress !== null;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) void uploadFiles(files);
        }}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={isUploading}>
        {isUploading ? <Spinner /> : <ImagePlus />}
        {isUploading ? (
          <span className="tabular-nums">
            {progress.done} / {progress.total}
          </span>
        ) : (
          "Add photos"
        )}
      </Button>
    </>
  );
}
