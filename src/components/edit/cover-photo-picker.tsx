"use client";

import { Images } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setCoverPhotoAction } from "@/app/album-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ViewerPhoto } from "@/lib/albums/album-types";
import { cn } from "@/lib/utils";

const CHOOSE_COVER_LABEL = "Choose cover image";

/** The album's cover, and a large grid of every photo to pick a new one from. Picking saves right away. */
export function CoverPhotoPicker({
  slug,
  photos,
  coverPhotoId,
}: {
  slug: string;
  photos: ViewerPhoto[];
  coverPhotoId: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const coverPhoto = photos.find((photo) => photo.id === coverPhotoId) ?? null;

  const chooseCover = (photoId: string) =>
    startSaving(async () => {
      await setCoverPhotoAction(slug, photoId);
      toast.success("Cover saved");
      setIsOpen(false);
    });

  return (
    <section className="flex flex-col gap-3">
      <div className="aspect-[3/2] overflow-hidden rounded-lg border bg-muted">
        {coverPhoto ? (
          <img src={coverPhoto.fullUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <Images className="size-8" />
          </div>
        )}
      </div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger render={<Button variant="secondary" className="w-full" disabled={photos.length === 0} />}>
          <Images /> {CHOOSE_COVER_LABEL}
        </DialogTrigger>
        <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{CHOOSE_COVER_LABEL}</DialogTitle>
          </DialogHeader>
          {/* The grid scrolls inside its own box; squeezed into the dialog's height, its rows would overlap. */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div
              aria-busy={isSaving}
              className={cn(
                "grid grid-cols-3 gap-1 p-1 transition-opacity sm:grid-cols-5 lg:grid-cols-7",
                isSaving && "pointer-events-none opacity-50",
              )}
            >
            {photos.map((photo, index) => {
              const isCover = photo.id === coverPhotoId;
              return (
                <button
                  key={photo.id}
                  type="button"
                  aria-label={`Photo ${index + 1}`}
                  aria-pressed={isCover}
                  onClick={() => chooseCover(photo.id)}
                  className={cn(
                    "aspect-square overflow-hidden rounded-sm bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isCover && "ring-4 ring-primary",
                  )}
                >
                  <img
                    src={photo.thumbUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition hover:scale-[1.03]"
                  />
                </button>
              );
            })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
