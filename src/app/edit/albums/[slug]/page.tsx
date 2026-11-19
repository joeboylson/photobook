import { notFound } from "next/navigation";
import { AlbumSettingsForm } from "@/components/edit/album-settings-form";
import { EditablePhotoGrid } from "@/components/edit/editable-photo-grid";
import { PhotoUploader } from "@/components/edit/photo-uploader";
import { IconLink } from "@/components/icon-link";
import { readAlbum } from "@/lib/albums/album-store";
import { signViewerPhotos } from "@/lib/albums/viewer-photos";
import { Eye } from "lucide-react";

export default async function EditAlbumPage({ params }: PageProps<"/edit/albums/[slug]">) {
  const { slug } = await params;
  const stored = await readAlbum(slug);
  if (!stored) notFound();

  const album = stored.value;
  const photos = await signViewerPhotos(album.photos);

  return (
    <>
      <div className="flex items-center gap-2">
        <h2 className="flex min-w-0 flex-1 items-baseline gap-2 text-lg font-semibold">
          <span className="truncate">{album.title}</span>
          <span className="text-sm font-normal text-muted-foreground tabular-nums">{photos.length}</span>
        </h2>
        <IconLink href={`/albums/${album.slug}`} label="View album" icon={Eye} />
        <PhotoUploader slug={album.slug} />
      </div>
      <EditablePhotoGrid slug={album.slug} photos={photos} />
      <AlbumSettingsForm
        slug={album.slug}
        title={album.title}
        access={album.access}
        hasPassword={Boolean(album.passwordHash)}
      />
    </>
  );
}
