import { AlbumCardGrid, type AlbumCard } from "@/components/albums/album-card-grid";
import { CreateAlbumForm } from "@/components/edit/create-album-form";
import { listAlbumSummaries } from "@/lib/albums/album-store";
import { signCoverUrl } from "@/lib/albums/viewer-photos";

export default async function EditHomePage() {
  const summaries = await listAlbumSummaries();
  const albums: AlbumCard[] = await Promise.all(
    summaries.map(async (summary) => ({ ...summary, coverUrl: await signCoverUrl(summary.coverPhotoId) })),
  );

  return (
    <>
      {albums.length > 0 && <AlbumCardGrid albums={albums} buildHref={(slug) => `/edit/albums/${slug}`} />}
      <CreateAlbumForm />
    </>
  );
}
