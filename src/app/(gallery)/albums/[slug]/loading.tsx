import { GRID_COLUMNS, DEFAULT_GRID_SIZE } from "@/components/gallery/grid-sizes";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Enough placeholder tiles to fill the first screen on a big monitor.
const PLACEHOLDER_TILE_COUNT = 48;

/** Shows right away when an album is opened, while its photos load. */
export default function AlbumLoading() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-2.5">
          <SidebarTrigger />
          <Skeleton className="h-5 w-40" />
        </div>
      </header>
      <div className={cn("mx-auto grid max-w-[1600px] gap-1 px-4 pt-4", GRID_COLUMNS[DEFAULT_GRID_SIZE])}>
        {Array.from({ length: PLACEHOLDER_TILE_COUNT }, (_, index) => (
          <Skeleton key={index} className="aspect-square rounded-sm" />
        ))}
      </div>
    </div>
  );
}
