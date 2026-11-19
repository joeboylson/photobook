"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const PHOTO_QUERY_PARAM = "photo";

/**
 * The open photo lives in the URL (?photo=…), so the back button closes the
 * viewer and a link can point at one photo. It uses the browser's history
 * directly rather than the router, so opening a photo doesn't reload the page
 * from the server.
 */
export function useOpenPhoto() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const openPhotoId = searchParams.get(PHOTO_QUERY_PARAM);

  const openPhoto = useCallback(
    (photoId: string | null, shouldReplace = false) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (photoId) nextParams.set(PHOTO_QUERY_PARAM, photoId);
      else nextParams.delete(PHOTO_QUERY_PARAM);

      const query = nextParams.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      if (shouldReplace) window.history.replaceState(null, "", href);
      else window.history.pushState(null, "", href);
    },
    [searchParams, pathname],
  );

  return { openPhotoId, openPhoto };
}
