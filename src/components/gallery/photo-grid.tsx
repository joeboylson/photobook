"use client";

import type { ViewerPhoto } from "@/lib/albums/album-types";
import { cn } from "@/lib/utils";
import { GRID_COLUMNS, type GridSize } from "./grid-sizes";

export function PhotoGrid({
  photos,
  gridSize,
  onOpenPhoto,
}: {
  photos: ViewerPhoto[];
  gridSize: GridSize;
  onOpenPhoto: (photoId: string) => void;
}) {
  // Large tiles are wider than the 400px thumbnails, so they use the viewer-size copy.
  const usesFullSize = gridSize === "large";

  return (
    <div className={cn("grid gap-1", GRID_COLUMNS[gridSize])}>
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => onOpenPhoto(photo.id)}
          className="group relative aspect-square overflow-hidden rounded-sm bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={photo.caption || `Photo ${index + 1}`}
        >
          <img
            src={usesFullSize ? photo.fullUrl : photo.thumbUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition group-hover:scale-[1.03]"
          />
        </button>
      ))}
    </div>
  );
}
