import { MONTHS_PER_YEAR } from "@/lib/constants";

// An album's month is stored as "YYYY-MM", like "2026-06".
const ALBUM_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const MONTH_LABEL_LOCALE = "en-US";

export const isAlbumMonth = (value: unknown): value is string =>
  typeof value === "string" && ALBUM_MONTH_PATTERN.test(value);

const padMonthNumber = (monthNumber: number): string => String(monthNumber).padStart(2, "0");

export const buildAlbumMonth = (year: number, monthNumber: number): string => `${year}-${padMonthNumber(monthNumber)}`;

export const readAlbumYear = (albumMonth: string): string => albumMonth.slice(0, 4);

export const readMonthNumber = (albumMonth: string): number => Number(albumMonth.slice(5, 7));

const describeMonthNumber = (monthNumber: number, style: "short" | "long"): string =>
  new Date(Date.UTC(2000, monthNumber - 1)).toLocaleString(MONTH_LABEL_LOCALE, { month: style, timeZone: "UTC" });

/** "Jun", for the tag beside an album in the sidebar. */
export const describeShortMonth = (albumMonth: string): string =>
  describeMonthNumber(readMonthNumber(albumMonth), "short");

export const MONTH_OPTIONS = Array.from({ length: MONTHS_PER_YEAR }, (_, index) => ({
  value: String(index + 1),
  label: describeMonthNumber(index + 1, "long"),
}));
