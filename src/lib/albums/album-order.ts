import { readAlbumYear } from "./album-month";
import type { AlbumSort, AlbumSummary } from "./album-types";

export const ALBUM_SORTS = ["date", "title"] as const;

export const DEFAULT_ALBUM_SORT: AlbumSort = "date";

export const isAlbumSort = (value: unknown): value is AlbumSort => ALBUM_SORTS.some((sort) => sort === value);

/** Albums from one year, or the undated ones when `year` is null. */
export type AlbumYearGroup = { year: string | null; albums: AlbumSummary[] };

const compareByTitle = (first: AlbumSummary, second: AlbumSummary): number =>
  first.title.localeCompare(second.title, undefined, { sensitivity: "base" });

export const sortAlbumsByTitle = (albums: AlbumSummary[]): AlbumSummary[] => [...albums].sort(compareByTitle);

const compareByMonthNewestFirst = (first: AlbumSummary, second: AlbumSummary): number =>
  (second.month ?? "").localeCompare(first.month ?? "") || compareByTitle(first, second);

/** Groups albums by year, newest year first, with undated albums in a last group of their own. */
export const groupAlbumsByYear = (albums: AlbumSummary[]): AlbumYearGroup[] => {
  const datedAlbums = [...albums].filter((album) => album.month !== null).sort(compareByMonthNewestFirst);
  const undatedAlbums = sortAlbumsByTitle(albums.filter((album) => album.month === null));

  const yearGroups = datedAlbums.reduce<AlbumYearGroup[]>((groups, album) => {
    const year = readAlbumYear(album.month!);
    const lastGroup = groups.at(-1);
    if (lastGroup?.year === year) return [...groups.slice(0, -1), { year, albums: [...lastGroup.albums, album] }];
    return [...groups, { year, albums: [album] }];
  }, []);

  return undatedAlbums.length > 0 ? [...yearGroups, { year: null, albums: undatedAlbums }] : yearGroups;
};
