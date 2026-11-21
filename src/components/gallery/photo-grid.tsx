"use client";

import { useEffect, useRef, useState } from "react";
import type { ViewerPhoto } from "@/lib/albums/album-types";
import { cn } from "@/lib/utils";
import { GRID_COLUMNS, type GridSize } from "./grid-sizes";

/** A tile pulses like a skeleton until its photo has loaded, then the photo fades in. */
function PhotoTile({
  photo,
  label,
  usesFullSize,
  onOpen,
}: {
  photo: ViewerPhoto;
  label: string;
  usesFullSize: boolean;
  onOpen: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // A cached image can finish loading before React attaches onLoad.
  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth) setIsLoaded(true);
  }, []);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-sm bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !isLoaded && "animate-pulse",
      )}
      aria-label={label}
    >
      <img
        ref={imageRef}
        src={usesFullSize ? photo.fullUrl : photo.thumbUrl}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "size-full object-cover transition group-hover:scale-[1.03]",
          isLoaded ? "opacity-100 duration-300" : "opacity-0",
        )}
      />
    </button>
  );
}

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
        <PhotoTile
          key={photo.id}
          photo={photo}
          label={photo.caption || `Photo ${index + 1}`}
          usesFullSize={usesFullSize}
          onOpen={() => onOpenPhoto(photo.id)}
        />
      ))}
    </div>
  );
}
