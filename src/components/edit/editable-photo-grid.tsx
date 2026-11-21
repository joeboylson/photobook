"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { removePhotoAction } from "@/app/album-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ViewerPhoto } from "@/lib/albums/album-types";

function EditablePhotoTile({ slug, photo }: { slug: string; photo: ViewerPhoto }) {
  const [isRemoving, startRemoving] = useTransition();

  return (
    <div className="group relative aspect-square overflow-hidden rounded-sm bg-muted">
      <img src={photo.thumbUrl} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant="secondary"
              size="icon-sm"
              aria-label="Remove photo"
              disabled={isRemoving}
              className="absolute top-1 right-1 rounded-full opacity-80 hover:opacity-100 md:opacity-0 md:group-hover:opacity-80"
            />
          }
        >
          {isRemoving ? <Spinner /> : <Trash2 />}
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this photo?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="secondary">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => startRemoving(() => removePhotoAction(slug, photo.id))}>
              <Trash2 /> Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function EditablePhotoGrid({ slug, photos }: { slug: string; photos: ViewerPhoto[] }) {
  return (
    <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
      {photos.map((photo) => (
        <EditablePhotoTile key={photo.id} slug={slug} photo={photo} />
      ))}
    </div>
  );
}
