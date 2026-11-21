"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { removePhotoAction } from "@/app/album-actions";
import { GRID_COLUMNS, type GridSize } from "@/components/gallery/grid-sizes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ViewerPhoto } from "@/lib/albums/album-types";
import { cn } from "@/lib/utils";

/**
 * The photo grid in remove mode: hovering a tile marks it in red with a trash
 * icon, and clicking it asks before removing. The grid stays locked while a
 * removal saves.
 */
export function RemovablePhotoGrid({ slug, photos, gridSize }: { slug: string; photos: ViewerPhoto[]; gridSize: GridSize }) {
  const [photoToRemove, setPhotoToRemove] = useState<ViewerPhoto | null>(null);
  const [isRemoving, startRemoving] = useTransition();
  const usesFullSize = gridSize === "large";

  const removePhoto = (photoId: string) =>
    startRemoving(async () => {
      try {
        await removePhotoAction(slug, photoId);
        toast.success("Photo removed");
      } catch {
        toast.error("Couldn't remove the photo");
      }
    });

  return (
    <>
      <div
        aria-busy={isRemoving}
        className={cn("grid gap-1", GRID_COLUMNS[gridSize], isRemoving && "pointer-events-none opacity-50")}
      >
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            aria-label={`Remove photo ${index + 1}`}
            onClick={() => setPhotoToRemove(photo)}
            className="group relative aspect-square overflow-hidden rounded-sm bg-muted outline-none hover:ring-4 hover:ring-red-500 focus-visible:ring-4 focus-visible:ring-red-500"
          >
            <img
              src={usesFullSize ? photo.fullUrl : photo.thumbUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Trash2 className="size-6" />
            </span>
          </button>
        ))}
      </div>
      <AlertDialog open={photoToRemove !== null} onOpenChange={(isOpen) => !isOpen && setPhotoToRemove(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this photo?</AlertDialogTitle>
          </AlertDialogHeader>
          {photoToRemove && <img src={photoToRemove.thumbUrl} alt="" className="mx-auto max-h-48 rounded-md" />}
          <AlertDialogFooter>
            <AlertDialogCancel variant="secondary">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (photoToRemove) removePhoto(photoToRemove.id);
                setPhotoToRemove(null);
              }}
            >
              <Trash2 /> Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
