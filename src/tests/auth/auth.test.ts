import { describe, expect, test } from "bun:test";
import { isEditorEmail, parseEditorEmails } from "@/lib/auth/editor-emails";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("parseEditorEmails", () => {
  test("splits on commas, trims and lowercases", () => {
    expect(parseEditorEmails(" Joe@Example.com, ,wife@example.com ")).toEqual(["joe@example.com", "wife@example.com"]);
  });
});

describe("isEditorEmail", () => {
  const editors = ["joe@example.com"];

  test("matches regardless of case", () => {
    expect(isEditorEmail("JOE@example.com", editors)).toBe(true);
  });

  test("rejects other and missing emails", () => {
    expect(isEditorEmail("someone@example.com", editors)).toBe(false);
    expect(isEditorEmail(undefined, editors)).toBe(false);
    expect(isEditorEmail("", editors)).toBe(false);
  });
});

describe("album passwords", () => {
  test("the right password matches", () => {
    expect(verifyPassword("cake", hashPassword("cake"))).toBe(true);
  });

  test("a wrong password doesn't", () => {
    expect(verifyPassword("pie", hashPassword("cake"))).toBe(false);
  });

  test("the same password hashes differently each time", () => {
    expect(hashPassword("cake")).not.toBe(hashPassword("cake"));
  });

  test("a damaged stored hash never matches", () => {
    expect(verifyPassword("cake", "not-a-hash")).toBe(false);
    expect(verifyPassword("cake", "scrypt$$")).toBe(false);
  });
});
