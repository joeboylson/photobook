import { Images } from "lucide-react";
import Link from "next/link";
import type { AlbumSummary } from "@/lib/albums/album-types";
import { AccessIcon } from "./access-icon";

export type AlbumCard = AlbumSummary & { coverUrl: string | null };

export function AlbumCardGrid({ albums, buildHref }: { albums: AlbumCard[]; buildHref: (slug: string) => string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {albums.map((album) => (
        <Link key={album.slug} href={buildHref(album.slug)} className="group space-y-1.5 outline-none">
          <div className="aspect-square overflow-hidden rounded-lg border bg-muted group-focus-visible:ring-2 group-focus-visible:ring-ring">
            {album.coverUrl ? (
              <img src={album.coverUrl} alt="" className="size-full object-cover transition group-hover:scale-[1.03]" />
            ) : (
              <div className="grid size-full place-items-center text-muted-foreground">
                <Images className="size-8" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 px-0.5">
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{album.title}</p>
            {album.access !== "public" && <AccessIcon access={album.access} className="text-muted-foreground" />}
          </div>
        </Link>
      ))}
    </div>
  );
}
