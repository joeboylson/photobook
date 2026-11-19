import { describe, expect, test } from "bun:test";
import { SIGNED_URL_WINDOW_MS } from "@/lib/constants";
import { buildAlbumKey, buildPhotoKey, parseAlbumSlugFromKey } from "@/lib/storage/object-keys";
import { getCurrentSigningDate } from "@/lib/storage/object-store";
import { chunkList, mapWithConcurrency } from "@/lib/utils/concurrency";

describe("object keys", () => {
  test("album keys round-trip to their slug", () => {
    expect(parseAlbumSlugFromKey(buildAlbumKey("around-town"))).toBe("around-town");
  });

  test("other keys aren't albums", () => {
    expect(parseAlbumSlugFromKey(buildPhotoKey("id", "thumb"))).toBeNull();
    expect(parseAlbumSlugFromKey("albums/.json")).toBeNull();
    expect(parseAlbumSlugFromKey("albums/notes.txt")).toBeNull();
  });

  test("photo keys keep sizes apart", () => {
    expect(buildPhotoKey("abc", "thumb")).not.toBe(buildPhotoKey("abc", "full"));
  });
});

describe("getCurrentSigningDate", () => {
  test("is the same for every moment within one window", () => {
    const windowStart = 100 * SIGNED_URL_WINDOW_MS;
    expect(getCurrentSigningDate(windowStart + 1).getTime()).toBe(windowStart);
    expect(getCurrentSigningDate(windowStart + SIGNED_URL_WINDOW_MS - 1).getTime()).toBe(windowStart);
    expect(getCurrentSigningDate(windowStart + SIGNED_URL_WINDOW_MS).getTime()).toBe(windowStart + SIGNED_URL_WINDOW_MS);
  });
});

describe("chunkList", () => {
  test("splits into groups, the last one shorter", () => {
    expect(chunkList([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkList([], 2)).toEqual([]);
  });
});

describe("mapWithConcurrency", () => {
  test("keeps input order and never runs more than the limit", async () => {
    const running = { now: 0, most: 0 };
    const results = await mapWithConcurrency([30, 10, 20, 5], 2, async (delayMs) => {
      running.now += 1;
      running.most = Math.max(running.most, running.now);
      await Bun.sleep(delayMs);
      running.now -= 1;
      return delayMs * 2;
    });
    expect(results).toEqual([60, 20, 40, 10]);
    expect(running.most).toBe(2);
  });

  test("handles an empty list", async () => {
    expect(await mapWithConcurrency([], 3, async () => 1)).toEqual([]);
  });
});
