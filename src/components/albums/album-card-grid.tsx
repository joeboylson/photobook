import { Images } from "lucide-react";
import Link from "next/link";
import type { AlbumSummary } from "@/lib/albums/album-types";
import { ACCESS_DETAILS } from "./access-icon";

export type AlbumCard = AlbumSummary & { isOpenToViewer: boolean; coverUrl: string | null };

/** The album's cover, or what stands in for it: a key or lock when it's locked, a photos icon when it's empty. */
function AlbumCover({ album }: { album: AlbumCard }) {
  if (album.isOpenToViewer && album.coverUrl) {
    return <img src={album.coverUrl} alt="" className="size-full object-cover transition group-hover:scale-[1.03]" />;
  }

  const { label, icon: Icon } = album.isOpenToViewer ? { label: "No photos", icon: Images } : ACCESS_DETAILS[album.access];
  return (
    <div className="grid size-full place-items-center text-muted-foreground" aria-label={label}>
      <Icon className="size-8" />
    </div>
  );
}

export function AlbumCardGrid({ albums, buildHref }: { albums: AlbumCard[]; buildHref: (slug: string) => string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {albums.map((album) => (
        <Link key={album.slug} href={buildHref(album.slug)} className="group space-y-1.5 outline-none">
          <div className="aspect-square overflow-hidden rounded-lg border bg-muted group-focus-visible:ring-2 group-focus-visible:ring-ring">
            <AlbumCover album={album} />
          </div>
          <p className="truncate px-0.5 text-sm font-medium">{album.title}</p>
        </Link>
      ))}
    </div>
  );
}
