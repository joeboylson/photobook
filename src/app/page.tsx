import { LogIn, Pencil } from "lucide-react";
import Link from "next/link";
import { AlbumCardGrid, type AlbumCard } from "@/components/albums/album-card-grid";
import { IconLink } from "@/components/icon-link";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getAlbumVisibility, listVisibleSummaries } from "@/lib/albums/album-rules";
import { listAlbumSummaries } from "@/lib/albums/album-store";
import { signCoverUrl } from "@/lib/albums/viewer-photos";
import { getViewer } from "@/lib/auth/session";
import { SITE_NAME } from "@/lib/constants";

export default async function HomePage() {
  const viewer = await getViewer();
  const summaries = listVisibleSummaries(await listAlbumSummaries(), viewer);
  // A locked album shows no cover, so its photos stay hidden until the password is entered.
  const albums: AlbumCard[] = await Promise.all(
    summaries.map(async (summary) => {
      const isOpenToViewer = getAlbumVisibility(summary, viewer) === "visible";
      return { ...summary, coverUrl: isOpenToViewer ? await signCoverUrl(summary.coverPhotoId) : null };
    }),
  );

  return (
    <div className="mx-auto max-w-[1600px] px-4">
      <header className="flex items-center gap-2 py-4">
        <h1 className="flex-1 text-lg font-semibold">
          <Link href="/">{SITE_NAME}</Link>
        </h1>
        {viewer.isEditor ? (
          <IconLink href="/edit" label="Edit" icon={Pencil} />
        ) : (
          <IconLink href="/sign-in" label="Sign in" icon={LogIn} prefetch={false} />
        )}
      </header>
      <main className="pb-16">
        {albums.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>No albums</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <AlbumCardGrid albums={albums} buildHref={(slug) => `/albums/${slug}`} />
        )}
      </main>
    </div>
  );
}
