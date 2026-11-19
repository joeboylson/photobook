import { ALBUM_ACCESS_LEVELS } from "@/lib/constants";
import type {
  Album,
  AlbumAccess,
  AlbumSettings,
  AlbumSummary,
  AlbumVisibility,
  Photo,
  Viewer,
} from "./album-types";

export const isAlbumAccess = (value: unknown): value is AlbumAccess =>
  ALBUM_ACCESS_LEVELS.some((level) => level === value);

export const slugifyTitle = (title: string): string =>
  title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getAlbumVisibility = (album: Pick<Album, "slug" | "access">, viewer: Viewer): AlbumVisibility => {
  if (viewer.isEditor || album.access === "public") return "visible";
  if (album.access === "private") return "hidden";

  const isUnlocked = viewer.unlockedAlbumSlugs.includes(album.slug);
  return isUnlocked ? "visible" : "needs-password";
};

export const summarizeAlbum = (album: Album): AlbumSummary => ({
  slug: album.slug,
  title: album.title,
  access: album.access,
  photoCount: album.photos.length,
  coverPhotoId: album.photos[0]?.id ?? null,
});

/** The albums a viewer sees listed on the home page: everything except private albums, unless they're an editor. */
export const listVisibleSummaries = (summaries: AlbumSummary[], viewer: Viewer): AlbumSummary[] =>
  summaries.filter((summary) => getAlbumVisibility(summary, viewer) !== "hidden");

const compareByTakenAt = (first: Photo, second: Photo): number => {
  const firstKey = first.takenAt ?? "";
  const secondKey = second.takenAt ?? "";
  if (firstKey === secondKey) return first.id.localeCompare(second.id);
  if (!firstKey) return 1;
  if (!secondKey) return -1;
  return firstKey.localeCompare(secondKey);
};

/** Adds photos in the order they were taken. Photos without a date go last. */
export const addPhotosToAlbum = (album: Album, newPhotos: Photo[], now: string): Album => {
  const existingIds = new Set(album.photos.map((photo) => photo.id));
  const photosToAdd = newPhotos.filter((photo) => !existingIds.has(photo.id));
  const photos = [...album.photos, ...photosToAdd].sort(compareByTakenAt);
  return { ...album, photos, updatedAt: now };
};

export const removePhotoFromAlbum = (album: Album, photoId: string, now: string): Album => ({
  ...album,
  photos: album.photos.filter((photo) => photo.id !== photoId),
  updatedAt: now,
});

export const applyAlbumSettings = (album: Album, settings: AlbumSettings, now: string): Album => ({
  ...album,
  ...settings,
  passwordHash: settings.access === "password" ? settings.passwordHash : null,
  updatedAt: now,
});

export const createEmptyAlbum = (title: string, settings: Omit<AlbumSettings, "title">, now: string): Album => ({
  slug: slugifyTitle(title),
  title: title.trim(),
  access: settings.access,
  passwordHash: settings.access === "password" ? settings.passwordHash : null,
  photos: [],
  createdAt: now,
  updatedAt: now,
});
