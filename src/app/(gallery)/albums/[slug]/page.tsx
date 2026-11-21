import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlbumGallery } from "@/components/gallery/album-gallery";
import { getAlbumVisibility, getCoverPhotoId } from "@/lib/albums/album-rules";
import { readAlbum } from "@/lib/albums/album-store";
import { signViewerPhotos } from "@/lib/albums/viewer-photos";
import { getViewer } from "@/lib/auth/session";
import { readSavedGridSize } from "@/lib/auth/view-preferences";
import { UnlockAlbumForm } from "./unlock-album-form";

export async function generateMetadata({ params }: PageProps<"/albums/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const stored = await readAlbum(slug);
  const isListable = stored && stored.value.access !== "private";
  return { title: isListable ? stored.value.title : undefined };
}

export default async function AlbumPage({ params }: PageProps<"/albums/[slug]">) {
  const { slug } = await params;
  const [stored, viewer] = await Promise.all([readAlbum(slug), getViewer()]);
  if (!stored) notFound();

  const album = stored.value;
  const visibility = getAlbumVisibility(album, viewer);
  // A private album looks exactly like one that doesn't exist.
  if (visibility === "hidden") notFound();
  if (visibility === "needs-password") return <UnlockAlbumForm slug={album.slug} title={album.title} />;

  // Editors get the edit menu. Only a yes/no about the password goes to the browser, never its hash.
  const editableAlbum = viewer.isEditor
    ? {
        slug: album.slug,
        title: album.title,
        month: album.month,
        access: album.access,
        hasPassword: Boolean(album.passwordHash),
        coverPhotoId: getCoverPhotoId(album),
      }
    : null;
  const photos = signViewerPhotos(album.photos);
  const savedGridSize = await readSavedGridSize();
  return (
    <AlbumGallery
      slug={album.slug}
      title={album.title}
      photos={photos}
      savedGridSize={savedGridSize}
      editableAlbum={editableAlbum}
    />
  );
}
