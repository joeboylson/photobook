"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { GRID_COLUMNS, type GridSize } from "@/components/gallery/grid-sizes";
import type { ViewerPhoto } from "@/lib/albums/album-types";
import { cn } from "@/lib/utils";

// A small move before a drag starts, so a plain click does nothing.
const MOUSE_DRAG_DISTANCE_PX = 4;
// On phones a drag starts after a short press, so swiping still scrolls the page.
const TOUCH_DRAG_DELAY_MS = 200;
const TOUCH_DRAG_TOLERANCE_PX = 6;

function SortablePhotoTile({ photo, usesFullSize }: { photo: ViewerPhoto; usesFullSize: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "relative aspect-square cursor-grab overflow-hidden rounded-sm bg-muted ring-2 ring-blue-500 select-none",
        isDragging && "z-10 cursor-grabbing ring-4 ring-yellow-400",
      )}
    >
      <img
        src={usesFullSize ? photo.fullUrl : photo.thumbUrl}
        alt=""
        draggable={false}
        className="pointer-events-none size-full object-cover"
      />
    </div>
  );
}

/**
 * The photo grid in reorder mode: tiles can't be opened, only dragged. Each
 * drop reports the new order, and the grid stays locked while it saves.
 */
export function ReorderablePhotoGrid({
  photos: initialPhotos,
  gridSize,
  isSaving,
  onReorder,
}: {
  photos: ViewerPhoto[];
  gridSize: GridSize;
  isSaving: boolean;
  onReorder: (orderedPhotoIds: string[]) => void;
}) {
  // Owns the order while reordering, so saves finishing in the background never
  // snap a tile back to an older order mid-drag.
  const [photos, setPhotos] = useState(initialPhotos);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: MOUSE_DRAG_DISTANCE_PX } }),
    useSensor(TouchSensor, { activationConstraint: { delay: TOUCH_DRAG_DELAY_MS, tolerance: TOUCH_DRAG_TOLERANCE_PX } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const fromIndex = photos.findIndex((photo) => photo.id === active.id);
    const toIndex = photos.findIndex((photo) => photo.id === over.id);
    const reordered = arrayMove(photos, fromIndex, toIndex);
    setPhotos(reordered);
    onReorder(reordered.map((photo) => photo.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={photos.map((photo) => photo.id)} strategy={rectSortingStrategy}>
        <div
          aria-busy={isSaving}
          className={cn("grid gap-2 p-1 transition-opacity", GRID_COLUMNS[gridSize], isSaving && "pointer-events-none opacity-50")}
        >
          {photos.map((photo) => (
            <SortablePhotoTile key={photo.id} photo={photo} usesFullSize={gridSize === "large"} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
