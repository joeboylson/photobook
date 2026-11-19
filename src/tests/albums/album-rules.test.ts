import { describe, expect, test } from "bun:test";
import {
  addPhotosToAlbum,
  applyAlbumSettings,
  createEmptyAlbum,
  getAlbumVisibility,
  isAlbumAccess,
  listVisibleSummaries,
  removePhotoFromAlbum,
  slugifyTitle,
  summarizeAlbum,
} from "@/lib/albums/album-rules";
import type { Album, AlbumSummary, Photo, Viewer } from "@/lib/albums/album-types";

const EARLIER = "2026-01-01T00:00:00.000Z";
const LATER = "2026-02-01T00:00:00.000Z";

const STRANGER: Viewer = { isEditor: false, unlockedAlbumSlugs: [] };
const EDITOR: Viewer = { isEditor: true, unlockedAlbumSlugs: [] };

const buildPhoto = (id: string, takenAt: string | null): Photo => ({ id, width: 4, height: 3, takenAt, caption: "" });

const buildAlbum = (overrides: Partial<Album> = {}): Album => ({
  ...createEmptyAlbum("Test Album", { access: "public", passwordHash: null }, EARLIER),
  ...overrides,
});

describe("slugifyTitle", () => {
  test("lowercases and joins words with dashes", () => {
    expect(slugifyTitle("  Around Town!  ")).toBe("around-town");
  });

  test("drops accents", () => {
    expect(slugifyTitle("Café Crème")).toBe("cafe-creme");
  });

  test("is empty when nothing usable is left", () => {
    expect(slugifyTitle("!!!")).toBe("");
  });
});

describe("isAlbumAccess", () => {
  test("accepts the three levels and nothing else", () => {
    expect(["public", "password", "private"].every(isAlbumAccess)).toBe(true);
    expect(isAlbumAccess("secret")).toBe(false);
    expect(isAlbumAccess(undefined)).toBe(false);
  });
});

describe("getAlbumVisibility", () => {
  test("public albums are open to everyone", () => {
    expect(getAlbumVisibility({ slug: "a", access: "public" }, STRANGER)).toBe("visible");
  });

  test("private albums are hidden from everyone but editors", () => {
    expect(getAlbumVisibility({ slug: "a", access: "private" }, STRANGER)).toBe("hidden");
    expect(getAlbumVisibility({ slug: "a", access: "private" }, EDITOR)).toBe("visible");
  });

  test("an unlocked album only opens that album", () => {
    const viewer: Viewer = { isEditor: false, unlockedAlbumSlugs: ["wedding"] };
    expect(getAlbumVisibility({ slug: "wedding", access: "password" }, viewer)).toBe("visible");
    expect(getAlbumVisibility({ slug: "other", access: "password" }, viewer)).toBe("needs-password");
  });

  test("unlocking a slug doesn't open a private album with that slug", () => {
    const viewer: Viewer = { isEditor: false, unlockedAlbumSlugs: ["wedding"] };
    expect(getAlbumVisibility({ slug: "wedding", access: "private" }, viewer)).toBe("hidden");
  });
});

describe("listVisibleSummaries", () => {
  const summaries: AlbumSummary[] = (["public", "password", "private"] as const).map((access) => ({
    slug: access,
    title: access,
    access,
    photoCount: 0,
    coverPhotoId: null,
  }));

  test("strangers see public and password albums", () => {
    expect(listVisibleSummaries(summaries, STRANGER).map((summary) => summary.slug)).toEqual(["public", "password"]);
  });

  test("editors see everything", () => {
    expect(listVisibleSummaries(summaries, EDITOR)).toHaveLength(3);
  });
});

describe("addPhotosToAlbum", () => {
  test("keeps photos in the order they were taken, undated last", () => {
    const album = buildAlbum({ photos: [buildPhoto("b", "2026-06-27T12:00:00")] });
    const updated = addPhotosToAlbum(
      album,
      [buildPhoto("c", null), buildPhoto("a", "2026-06-27T09:00:00")],
      LATER,
    );
    expect(updated.photos.map((photo) => photo.id)).toEqual(["a", "b", "c"]);
    expect(updated.updatedAt).toBe(LATER);
  });

  test("skips photos already in the album", () => {
    const album = buildAlbum({ photos: [buildPhoto("a", null)] });
    expect(addPhotosToAlbum(album, [buildPhoto("a", null)], LATER).photos).toHaveLength(1);
  });

  test("doesn't change the album it was given", () => {
    const album = buildAlbum();
    addPhotosToAlbum(album, [buildPhoto("a", null)], LATER);
    expect(album.photos).toHaveLength(0);
  });
});

describe("removePhotoFromAlbum", () => {
  test("removes only that photo", () => {
    const album = buildAlbum({ photos: [buildPhoto("a", null), buildPhoto("b", null)] });
    expect(removePhotoFromAlbum(album, "a", LATER).photos.map((photo) => photo.id)).toEqual(["b"]);
  });
});

describe("applyAlbumSettings", () => {
  test("drops the password when the album stops being a password album", () => {
    const album = buildAlbum({ access: "password", passwordHash: "hash" });
    const updated = applyAlbumSettings(album, { title: "New", access: "public", passwordHash: "hash" }, LATER);
    expect(updated.passwordHash).toBeNull();
    expect(updated.title).toBe("New");
  });

  test("keeps the slug when the title changes, so links keep working", () => {
    const album = buildAlbum();
    expect(applyAlbumSettings(album, { title: "Renamed", access: "public", passwordHash: null }, LATER).slug).toBe(
      album.slug,
    );
  });
});

describe("createEmptyAlbum", () => {
  test("only keeps a password for password albums", () => {
    expect(createEmptyAlbum("A", { access: "private", passwordHash: "hash" }, EARLIER).passwordHash).toBeNull();
    expect(createEmptyAlbum("A", { access: "password", passwordHash: "hash" }, EARLIER).passwordHash).toBe("hash");
  });
});

describe("summarizeAlbum", () => {
  test("uses the first photo as the cover", () => {
    const album = buildAlbum({ photos: [buildPhoto("first", null), buildPhoto("second", null)] });
    expect(summarizeAlbum(album)).toMatchObject({ photoCount: 2, coverPhotoId: "first" });
  });

  test("has no cover when empty", () => {
    expect(summarizeAlbum(buildAlbum()).coverPhotoId).toBeNull();
  });
});
