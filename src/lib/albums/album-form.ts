import { isAlbumMonth } from "./album-month";
import { isAlbumAccess, slugifyTitle } from "./album-rules";
import type { AlbumAccess } from "./album-types";

export type AlbumForm = { title: string; month: string; access: AlbumAccess; newPassword: string | null };

export type ParsedAlbumForm = { form: AlbumForm; error: null } | { form: null; error: string };

const readText = (formData: FormData, name: string): string => String(formData.get(name) ?? "").trim();

/**
 * `hasExistingPassword` lets a password album keep its current password when
 * the field is left blank on the settings form.
 */
export const parseAlbumForm = (formData: FormData, hasExistingPassword: boolean): ParsedAlbumForm => {
  const title = readText(formData, "title");
  const month = readText(formData, "month");
  const access = readText(formData, "access");
  const password = readText(formData, "password");

  if (!slugifyTitle(title)) return { form: null, error: "Add a name" };
  if (!isAlbumMonth(month)) return { form: null, error: "Pick a month and year" };
  if (!isAlbumAccess(access)) return { form: null, error: "Pick who can see it" };

  const isMissingPassword = access === "password" && !password && !hasExistingPassword;
  if (isMissingPassword) return { form: null, error: "Add a password" };

  return { form: { title, month, access, newPassword: password || null }, error: null };
};
