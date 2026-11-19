import type { ALBUM_ACCESS_LEVELS, PHOTO_SIZES } from "@/lib/constants";

export type AlbumAccess = (typeof ALBUM_ACCESS_LEVELS)[number];

export type PhotoSize = keyof typeof PHOTO_SIZES;

export type Photo = {
  id: string;
  width: number;
  height: number;
  /** Local time on the camera, like "2026-06-27T19:27:55". Null when the file had no date. */
  takenAt: string | null;
  caption: string;
};

export type Album = {
  slug: string;
  title: string;
  access: AlbumAccess;
  /** Only set for password albums. Never sent to the browser. */
  passwordHash: string | null;
  photos: Photo[];
  createdAt: string;
  updatedAt: string;
};

export type AlbumSummary = {
  slug: string;
  title: string;
  access: AlbumAccess;
  photoCount: number;
  coverPhotoId: string | null;
};

export type ViewerPhoto = Photo & {
  thumbUrl: string;
  fullUrl: string;
};

export type Viewer = {
  isEditor: boolean;
  unlockedAlbumSlugs: string[];
};

export type AlbumVisibility = "visible" | "needs-password" | "hidden";

export type AlbumSettings = {
  title: string;
  access: AlbumAccess;
  passwordHash: string | null;
};
