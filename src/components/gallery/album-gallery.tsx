"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { reorderPhotosAction } from "@/app/album-actions";
import { AlbumEditSheet, type EditableAlbum } from "@/components/edit/album-edit-sheet";
import { RemovablePhotoGrid } from "@/components/edit/removable-photo-grid";
import { ReorderablePhotoGrid } from "@/components/edit/reorderable-photo-grid";
import { REORDER_BUTTON_CLASS } from "@/components/button-colors";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import type { ViewerPhoto } from "@/lib/albums/album-types";
import { writePreferenceCookie } from "@/lib/auth/preference-cookie";
import { GRID_SIZE_COOKIE_NAME } from "@/lib/constants";
import { GridSizeToggle } from "./grid-size-toggle";
import type { GridSize } from "./grid-sizes";
import { PhotoGrid } from "./photo-grid";
import { PhotoViewer } from "./photo-viewer";
import { useOpenPhoto } from "./use-open-photo";

export function AlbumGallery({
  slug,
  title,
  photos,
  savedGridSize,
  editableAlbum,
}: {
  slug: string;
  title: string;
  photos: ViewerPhoto[];
  savedGridSize: GridSize;
  /** Only passed for editors. */
  editableAlbum: EditableAlbum | null;
}) {
  const [gridSize, setGridSize] = useState<GridSize>(savedGridSize);
  const [mode, setMode] = useState<"view" | "reorder" | "remove">("view");
  const [isSavingOrder, startSavingOrder] = useTransition();
  const { openPhotoId, openPhoto } = useOpenPhoto();

  const changeGridSize = (size: GridSize) => {
    setGridSize(size);
    writePreferenceCookie(GRID_SIZE_COOKIE_NAME, size);
  };

  // The grid is locked until each drop is saved, so only one save runs at a time.
  const saveOrder = (orderedPhotoIds: string[]) =>
    startSavingOrder(async () => {
      try {
        await reorderPhotosAction(slug, orderedPhotoIds);
        toast.success("Order saved");
      } catch {
        toast.error("Couldn't save the new order");
        // Leaving reorder mode shows the order that's actually saved.
        setMode("view");
      }
    });

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-2.5">
          <SidebarTrigger />
          <h1 className="flex min-w-0 flex-1 items-baseline gap-2 text-base font-semibold">
            <span className="truncate">{title}</span>
            <span className="text-sm font-normal text-muted-foreground tabular-nums">{photos.length}</span>
          </h1>
          <GridSizeToggle gridSize={gridSize} onChange={changeGridSize} />
          {mode === "reorder" && (
            <Button size="sm" className={REORDER_BUTTON_CLASS} onClick={() => setMode("view")} disabled={isSavingOrder}>
              {isSavingOrder ? <Spinner /> : <Check />} Done
            </Button>
          )}
          {mode === "remove" && (
            <Button size="sm" variant="destructive" onClick={() => setMode("view")}>
              <Check /> Done
            </Button>
          )}
          {mode === "view" && editableAlbum && (
            <AlbumEditSheet
              album={editableAlbum}
              photos={photos}
              onReorderPhotos={() => setMode("reorder")}
              onRemovePhotos={() => setMode("remove")}
            />
          )}
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] px-4 pt-4 pb-16">
        {photos.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>No photos</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : mode === "reorder" ? (
          <ReorderablePhotoGrid photos={photos} gridSize={gridSize} isSaving={isSavingOrder} onReorder={saveOrder} />
        ) : mode === "remove" ? (
          <RemovablePhotoGrid slug={slug} photos={photos} gridSize={gridSize} />
        ) : (
          <PhotoGrid photos={photos} gridSize={gridSize} onOpenPhoto={openPhoto} />
        )}
      </div>
      <PhotoViewer slug={slug} photos={photos} openPhotoId={openPhotoId} onOpenPhoto={openPhoto} />
    </div>
  );
}
