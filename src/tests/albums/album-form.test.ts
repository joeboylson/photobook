import { describe, expect, test } from "bun:test";
import { parseAlbumForm } from "@/lib/albums/album-form";

const buildFormData = (fields: Record<string, string>): FormData => {
  const formData = new FormData();
  Object.entries(fields).forEach(([name, value]) => formData.set(name, value));
  return formData;
};

describe("parseAlbumForm", () => {
  test("reads a complete form", () => {
    const parsed = parseAlbumForm(buildFormData({ title: " Wedding ", month: "2026-06", access: "password", password: "cake" }), false);
    expect(parsed).toEqual({ form: { title: "Wedding", month: "2026-06", access: "password", newPassword: "cake" }, error: null });
  });

  test("needs a name with letters or numbers", () => {
    expect(parseAlbumForm(buildFormData({ title: "!!", access: "public" }), false).error).toBe("Add a name");
  });

  test("rejects an unknown access level", () => {
    expect(parseAlbumForm(buildFormData({ title: "A", month: "2026-06", access: "secret" }), false).error).toBe("Pick who can see it");
  });

  test("needs a password for a new password album", () => {
    expect(parseAlbumForm(buildFormData({ title: "A", month: "2026-06", access: "password" }), false).error).toBe("Add a password");
  });

  test("keeps the existing password when the field is left blank", () => {
    const parsed = parseAlbumForm(buildFormData({ title: "A", month: "2026-06", access: "password", password: "" }), true);
    expect(parsed.form?.newPassword).toBeNull();
  });

  test("needs a month and year", () => {
    expect(parseAlbumForm(buildFormData({ title: "A", access: "public" }), false).error).toBe("Pick a month and year");
    expect(parseAlbumForm(buildFormData({ title: "A", month: "2026-13", access: "public" }), false).error).toBe(
      "Pick a month and year",
    );
  });
});
