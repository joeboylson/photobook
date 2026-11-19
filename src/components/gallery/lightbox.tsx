"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ViewerPhoto } from "@/lib/albums/album-types";
import { usePanZoom } from "./use-pan-zoom";

/** The photo on its own, on black, to pan and zoom. */
export function Lightbox({
  photo,
  isOpen,
  onOpenChange,
}: {
  photo: ViewerPhoto;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxElement, setBoxElement] = useState<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { view, handlers, resetView } = usePanZoom(boxRef, imageRef, boxElement);

  useEffect(() => {
    resetView();
    // Each photo and each opening starts fitted to the screen.
  }, [isOpen, photo.id]);

  const isZoomedIn = view.scale > 1;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Popup
          data-lightbox
          className="fixed inset-0 z-50 bg-black outline-none data-open:animate-in data-open:fade-in-0"
        >
          <DialogPrimitive.Title className="sr-only">{photo.caption || "Photo"}</DialogPrimitive.Title>
          <div
            ref={(element) => {
              boxRef.current = element;
              setBoxElement(element);
            }}
            className="flex size-full touch-none items-center justify-center overflow-hidden select-none"
            style={{ cursor: isZoomedIn ? "grab" : "zoom-in" }}
            {...handlers}
          >
            <img
              ref={imageRef}
              src={photo.fullUrl}
              alt=""
              draggable={false}
              className="max-h-full max-w-full object-contain"
              style={{
                aspectRatio: `${photo.width} / ${photo.height}`,
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                willChange: "transform",
              }}
            />
          </div>
          <DialogPrimitive.Close
            render={
              <Button
                variant="secondary"
                size="icon"
                aria-label="Close"
                className="absolute top-3 left-3 rounded-full opacity-80 hover:opacity-100"
              />
            }
          >
            <X />
          </DialogPrimitive.Close>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
