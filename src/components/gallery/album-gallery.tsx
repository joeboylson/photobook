"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import type { ViewerPhoto } from "@/lib/albums/album-types";
import { GridSizeToggle } from "./grid-size-toggle";
import { DEFAULT_GRID_SIZE, type GridSize } from "./grid-sizes";
import { PhotoGrid } from "./photo-grid";
import { PhotoViewer } from "./photo-viewer";
import { useOpenPhoto } from "./use-open-photo";

export function AlbumGallery({ title, photos }: { title: string; photos: ViewerPhoto[] }) {
  const [gridSize, setGridSize] = useState<GridSize>(DEFAULT_GRID_SIZE);
  const { openPhotoId, openPhoto } = useOpenPhoto();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-2.5">
          <Button variant="ghost" size="icon-sm" aria-label="All albums" nativeButton={false} render={<Link href="/" />}>
            <ArrowLeft />
          </Button>
          <h1 className="flex min-w-0 flex-1 items-baseline gap-2 text-base font-semibold">
            <span className="truncate">{title}</span>
            <span className="text-sm font-normal text-muted-foreground tabular-nums">{photos.length}</span>
          </h1>
          <GridSizeToggle gridSize={gridSize} onChange={setGridSize} />
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 pt-4 pb-16">
        {photos.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>No photos</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <PhotoGrid photos={photos} gridSize={gridSize} onOpenPhoto={openPhoto} />
        )}
      </main>
      <PhotoViewer photos={photos} openPhotoId={openPhotoId} onOpenPhoto={openPhoto} />
    </div>
  );
}
