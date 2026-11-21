"use server";

import { setTimeout as wait } from "node:timers/promises";
import { redirect } from "next/navigation";
import { readAlbum } from "@/lib/albums/album-store";
import { verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
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
