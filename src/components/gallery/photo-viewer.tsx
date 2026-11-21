"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { signPhotoDownloadAction } from "@/app/(gallery)/albums/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ViewerPhoto } from "@/lib/albums/album-types";
import { cn } from "@/lib/utils";
import { Lightbox } from "./lightbox";
import { SWIPE_EXIT_MS, useSwipe } from "./use-swipe";

const KEYBOARD_IGNORED_TARGETS = 'input, textarea, [role="listbox"], [data-lightbox]';

/** The viewer's photo: starts invisible and fades in once loaded. Keyed by photo, so each new photo fades in fresh. */
function FadeInPhoto({
  photo,
  offsetPx,
  isLeaving,
  onOpenLightbox,
}: {
  photo: ViewerPhoto;
  offsetPx: number;
  isLeaving: boolean;
  onOpenLightbox: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // A cached image can finish loading before React attaches onLoad.
  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth) setIsLoaded(true);
  }, []);

  const transition = isLeaving
    ? `transform ${SWIPE_EXIT_MS}ms ease-in`
    : offsetPx
      ? "none"
      : "transform 150ms ease-out";

  return (
    <img
      ref={imageRef}
      src={photo.fullUrl}
      alt={photo.caption}
      draggable={false}
      onLoad={() => setIsLoaded(true)}
      onClick={onOpenLightbox}
      // An animation rather than a transition, so it plays even when the photo was already preloaded.
      className={cn(
        "max-h-full max-w-full cursor-zoom-in object-contain select-none",
        isLoaded && "animate-in duration-300 ease-out fade-in-0",
      )}
      style={{
        aspectRatio: `${photo.width} / ${photo.height}`,
        opacity: isLoaded ? 1 : 0,
        transform: offsetPx ? `translateX(${offsetPx}px)` : undefined,
        transition,
      }}
    />
  );
}

/** Full-screen view of one photo, with arrows, keys and swipes to step through the rest. */
export function PhotoViewer({
  slug,
  photos,
  openPhotoId,
  onOpenPhoto,
}: {
  slug: string;
  photos: ViewerPhoto[];
  openPhotoId: string | null;
  onOpenPhoto: (photoId: string | null, shouldReplace?: boolean) => void;
}) {
  const index = openPhotoId ? photos.findIndex((photo) => photo.id === openPhotoId) : -1;
  const photo = index >= 0 ? photos[index] : null;
  const previousPhoto = index > 0 ? photos[index - 1] : null;
  const nextPhoto = index >= 0 && index < photos.length - 1 ? photos[index + 1] : null;
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isPreparingDownload, startPreparingDownload] = useTransition();

  // The link says "save this file", so going to it downloads without leaving the page.
  const downloadPhoto = (photoId: string) =>
    startPreparingDownload(async () => {
      try {
        window.location.assign(await signPhotoDownloadAction(slug, photoId));
      } catch {
        toast.error("Couldn't download this photo");
      }
    });

  const showPrevious = previousPhoto && (() => onOpenPhoto(previousPhoto.id, true));
  const showNext = nextPhoto && (() => onOpenPhoto(nextPhoto.id, true));
  const swipe = useSwipe(photo?.id ?? null, showPrevious, showNext);

  useEffect(() => {
    if (!photo) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const isTypingOrInLightbox = (event.target as HTMLElement).closest(KEYBOARD_IGNORED_TARGETS);
      if (isTypingOrInLightbox) return;
      if (event.key === "ArrowLeft" && previousPhoto) onOpenPhoto(previousPhoto.id, true);
      if (event.key === "ArrowRight" && nextPhoto) onOpenPhoto(nextPhoto.id, true);
    };
    // Capture phase: the dialog's buttons stop arrow keys from bubbling up to the window.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [photo, previousPhoto, nextPhoto, onOpenPhoto]);

  // Warm the neighbors so stepping feels instant.
  useEffect(() => {
    [previousPhoto, nextPhoto].forEach((neighbor) => {
      if (neighbor) new Image().src = neighbor.fullUrl;
    });
  }, [previousPhoto, nextPhoto]);

  return (
    <DialogPrimitive.Root open={Boolean(photo)} onOpenChange={(isOpen) => !isOpen && onOpenPhoto(null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black data-open:animate-in data-open:fade-in-0" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex outline-none">
          {photo && (
            <>
              <div
                className="relative flex min-h-0 flex-1 touch-pan-y touch-pinch-zoom items-center justify-center overflow-hidden p-2 md:p-6"
                {...swipe.handlers}
              >
                <FadeInPhoto
                  key={photo.id}
                  photo={photo}
                  offsetPx={swipe.offsetPx}
                  isLeaving={swipe.isLeaving}
                  onOpenLightbox={() => setIsLightboxOpen(true)}
                />
                {showPrevious && (
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="Previous photo"
                    className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                    onClick={showPrevious}
                  >
                    <ChevronLeft />
                  </Button>
                )}
                {showNext && (
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="Next photo"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                    onClick={showNext}
                  >
                    <ChevronRight />
                  </Button>
                )}
                <DialogPrimitive.Close
                  render={
                    <Button
                      variant="secondary"
                      size="icon"
                      aria-label="Close"
                      className="absolute top-2 left-2 rounded-full opacity-80 hover:opacity-100"
                    />
                  }
                >
                  <X />
                </DialogPrimitive.Close>
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Download photo"
                  disabled={isPreparingDownload}
                  onClick={() => downloadPhoto(photo.id)}
                  className="absolute top-2 right-2 rounded-full opacity-80 hover:opacity-100"
                >
                  {isPreparingDownload ? <Spinner /> : <Download />}
                </Button>
              </div>

              {/* The dialog needs a title for screen readers, but only the photo shows on screen. */}
              <DialogPrimitive.Title className="sr-only">{photo.caption || `Photo ${index + 1}`}</DialogPrimitive.Title>
              <Lightbox photo={photo} isOpen={isLightboxOpen} onOpenChange={setIsLightboxOpen} />
            </>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
