import { describe, expect, test } from "bun:test";
import { describeShortMonth, isAlbumMonth } from "@/lib/albums/album-month";
import { groupAlbumsByYear, sortAlbumsByTitle } from "@/lib/albums/album-order";
import type { AlbumSummary } from "@/lib/albums/album-types";

const buildSummary = (title: string, month: string | null): AlbumSummary => ({
  slug: title.toLowerCase(),
  title,
  access: "public",
  month,
  photoCount: 0,
  coverPhotoId: null,
});

describe("isAlbumMonth", () => {
  test("accepts a year and a month from 01 to 12", () => {
    expect(isAlbumMonth("2026-06")).toBe(true);
    expect(isAlbumMonth("2026-12")).toBe(true);
  });

  test("rejects anything else", () => {
    expect(isAlbumMonth("2026-13")).toBe(false);
    expect(isAlbumMonth("2026-6")).toBe(false);
    expect(isAlbumMonth("June 2026")).toBe(false);
    expect(isAlbumMonth(null)).toBe(false);
  });
});

describe("describeShortMonth", () => {
  test("names the month", () => {
    expect(describeShortMonth("2026-06")).toBe("Jun");
    expect(describeShortMonth("2025-01")).toBe("Jan");
  });
});

describe("sortAlbumsByTitle", () => {
  test("sorts A to Z, ignoring case", () => {
    const albums = [buildSummary("wedding", null), buildSummary("Around Town", null), buildSummary("Beach", null)];
    expect(sortAlbumsByTitle(albums).map((album) => album.title)).toEqual(["Around Town", "Beach", "wedding"]);
  });
});

describe("groupAlbumsByYear", () => {
  test("groups by year, newest first, and newest month first within a year", () => {
    const groups = groupAlbumsByYear([
      buildSummary("Spring", "2025-04"),
      buildSummary("Wedding", "2026-06"),
      buildSummary("Fall", "2025-10"),
      buildSummary("Trip", "2026-08"),
    ]);
    expect(groups.map((group) => [group.year, group.albums.map((album) => album.title)])).toEqual([
      ["2026", ["Trip", "Wedding"]],
      ["2025", ["Fall", "Spring"]],
    ]);
  });

  test("puts undated albums in a last group, by title", () => {
    const groups = groupAlbumsByYear([
      buildSummary("Zoo", null),
      buildSummary("Wedding", "2026-06"),
      buildSummary("Attic", null),
    ]);
    expect(groups.at(-1)).toEqual({ year: null, albums: [buildSummary("Attic", null), buildSummary("Zoo", null)] });
  });

  test("goes by title within the same month", () => {
    const groups = groupAlbumsByYear([buildSummary("B", "2026-06"), buildSummary("A", "2026-06")]);
    expect(groups[0].albums.map((album) => album.title)).toEqual(["A", "B"]);
  });

  test("has no groups without albums", () => {
    expect(groupAlbumsByYear([])).toEqual([]);
  });
});
