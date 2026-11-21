import { describe, expect, test } from "bun:test";
import { fitWithinEdge } from "@/lib/photos/photo-dimensions";
import { formatLocalDateTime } from "@/lib/photos/taken-at";

describe("fitWithinEdge", () => {
  test("shrinks the longest edge to the limit", () => {
    expect(fitWithinEdge({ width: 4000, height: 3000 }, 2000)).toEqual({ width: 2000, height: 1500 });
    expect(fitWithinEdge({ width: 3000, height: 4000 }, 400)).toEqual({ width: 300, height: 400 });
  });

  test("never enlarges a small photo", () => {
    expect(fitWithinEdge({ width: 300, height: 200 }, 400)).toEqual({ width: 300, height: 200 });
  });

  test("keeps very thin photos at least a pixel wide", () => {
    expect(fitWithinEdge({ width: 10000, height: 1 }, 400)).toEqual({ width: 400, height: 1 });
  });
});

describe("formatLocalDateTime", () => {
  test("uses the local clock parts, zero-padded", () => {
    expect(formatLocalDateTime(new Date(2026, 0, 5, 7, 3, 9))).toBe("2026-01-05T07:03:09");
  });
});
