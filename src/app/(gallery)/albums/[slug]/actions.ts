"use server";

import { setTimeout as wait } from "node:timers/promises";
import { redirect } from "next/navigation";
import { getAlbumVisibility } from "@/lib/albums/album-rules";
import { readAlbum } from "@/lib/albums/album-store";
import { signPhotoDownloadUrl } from "@/lib/albums/viewer-photos";
import { verifyPassword } from "@/lib/auth/password";
import { getSession, getViewer } from "@/lib/auth/session";
import { WRONG_PASSWORD_DELAY_MS } from "@/lib/constants";

export type UnlockAlbumState = { isWrongPassword: boolean };

export async function unlockAlbum(
  slug: string,
  _previousState: UnlockAlbumState,
  formData: FormData,
): Promise<UnlockAlbumState> {
  const password = String(formData.get("password") ?? "");
  const stored = await readAlbum(slug);
  const passwordHash = stored?.value.access === "password" ? stored.value.passwordHash : null;
  const isCorrect = Boolean(passwordHash) && verifyPassword(password, passwordHash!);

  if (!isCorrect) {
    await wait(WRONG_PASSWORD_DELAY_MS);
    return { isWrongPassword: true };
  }

  const session = await getSession();
  const unlockedAlbumSlugs = session.unlockedAlbumSlugs ?? [];
  session.unlockedAlbumSlugs = unlockedAlbumSlugs.includes(slug) ? unlockedAlbumSlugs : [...unlockedAlbumSlugs, slug];
  await session.save();
  redirect(`/albums/${slug}`);
}

// Anyone who can see the album may download from it, so this checks album
// access instead of requireEditor(). It never signs a link for a locked album.
export async function signPhotoDownloadAction(slug: string, photoId: string): Promise<string> {
  const [stored, viewer] = await Promise.all([readAlbum(slug), getViewer()]);
  const canSeeAlbum = stored !== null && getAlbumVisibility(stored.value, viewer) === "visible";
  if (!canSeeAlbum) throw new Error("Album not found");

  const photoIndex = stored.value.photos.findIndex((photo) => photo.id === photoId);
  if (photoIndex < 0) throw new Error("Photo not found");
  return signPhotoDownloadUrl(slug, photoId, photoIndex + 1);
}
