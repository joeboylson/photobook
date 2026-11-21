"use client";

import { ArrowDownUp, Ellipsis, ImageMinus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteAlbumAction } from "@/app/album-actions";
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
import { REORDER_BUTTON_CLASS } from "@/components/button-colors";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AlbumAccess, ViewerPhoto } from "@/lib/albums/album-types";
import { AlbumSettingsForm } from "./album-settings-form";
import { CoverPhotoPicker } from "./cover-photo-picker";
import { PhotoUploader } from "./photo-uploader";

export type EditableAlbum = {
  slug: string;
  title: string;
  month: string | null;
  access: AlbumAccess;
  hasPassword: boolean;
  coverPhotoId: string | null;
};

const EDIT_LABEL = "Edit album";

function DeleteAlbumButton({ slug, title }: { slug: string; title: string }) {
  const [isDeleting, startDeleting] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" className="self-start" />}>
        <Trash2 /> Delete album
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{title}” and all its photos?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="secondary">Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={() => startDeleting(() => deleteAlbumAction(slug))}
          >
            {isDeleting ? <Spinner /> : <Trash2 />} Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const MIN_PHOTOS_TO_REORDER = 2;

export function AlbumEditSheet({
  album,
  photos,
  onReorderPhotos,
  onRemovePhotos,
}: {
  album: EditableAlbum;
  photos: ViewerPhoto[];
  onReorderPhotos: () => void;
  onRemovePhotos: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const canReorder = photos.length >= MIN_PHOTOS_TO_REORDER;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger
          render={<SheetTrigger render={<Button variant="secondary" size="icon-sm" aria-label={EDIT_LABEL} />} />}
        >
          <Ellipsis />
        </TooltipTrigger>
        <TooltipContent>{EDIT_LABEL}</TooltipContent>
      </Tooltip>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{EDIT_LABEL}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-6">
          <CoverPhotoPicker slug={album.slug} photos={photos} coverPhotoId={album.coverPhotoId} />
          <Separator />
          <AlbumSettingsForm
            slug={album.slug}
            title={album.title}
            month={album.month}
            access={album.access}
            hasPassword={album.hasPassword}
          />
          <Separator />
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h3 className="flex-1 text-sm font-medium">
                Photos <span className="text-muted-foreground tabular-nums">{photos.length}</span>
              </h3>
              <PhotoUploader slug={album.slug} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                className={REORDER_BUTTON_CLASS}
                disabled={!canReorder}
                onClick={() => {
                  setIsOpen(false);
                  onReorderPhotos();
                }}
              >
                <ArrowDownUp /> Reorder photos
              </Button>
              <Button
                variant="destructive"
                disabled={photos.length === 0}
                onClick={() => {
                  setIsOpen(false);
                  onRemovePhotos();
                }}
              >
                <ImageMinus /> Remove photos
              </Button>
            </div>
          </section>
          <Separator />
          <DeleteAlbumButton slug={album.slug} title={album.title} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
