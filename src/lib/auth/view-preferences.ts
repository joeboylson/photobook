import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_GRID_SIZE, type GridSize, isGridSize } from "@/components/gallery/grid-sizes";
import { DEFAULT_ALBUM_SORT, isAlbumSort } from "@/lib/albums/album-order";
import type { AlbumSort } from "@/lib/albums/album-types";
import { ALBUM_SORT_COOKIE_NAME, GRID_SIZE_COOKIE_NAME } from "@/lib/constants";

/** The tile size this browser picked last, so every album opens at that size. */
export const readSavedGridSize = async (): Promise<GridSize> => {
  const savedValue = (await cookies()).get(GRID_SIZE_COOKIE_NAME)?.value;
  return isGridSize(savedValue) ? savedValue : DEFAULT_GRID_SIZE;
};

/** How this browser last ordered the sidebar's albums. */
export const readSavedAlbumSort = async (): Promise<AlbumSort> => {
  const savedValue = (await cookies()).get(ALBUM_SORT_COOKIE_NAME)?.value;
  return isAlbumSort(savedValue) ? savedValue : DEFAULT_ALBUM_SORT;
};
