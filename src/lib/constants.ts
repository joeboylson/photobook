export const SITE_NAME = "Photobook";

export const ALBUM_ACCESS_LEVELS = ["public", "password", "private"] as const;

export const MONTHS_PER_YEAR = 12;

export const PHOTO_SIZES = {
  thumb: { maxEdgePx: 400, quality: 0.7 },
  full: { maxEdgePx: 2000, quality: 0.82 },
} as const;

export const PHOTO_CONTENT_TYPE = "image/webp";
export const PHOTO_FILE_EXTENSION = "webp";

export const ALBUMS_PREFIX = "albums/";
export const PHOTOS_PREFIX = "photos/";
export const ALBUM_FILE_EXTENSION = ".json";

// Photo links are all signed as of the start of the current hour, so every page
// load within that hour gets the same links and the browser can reuse its
// cached copies. Each link lasts two hours, so it's good for at least an hour
// after any page load.
export const SIGNED_URL_WINDOW_MS = 60 * 60 * 1000;
export const SIGNED_URL_LIFETIME_SECONDS = 2 * 60 * 60;
export const UPLOAD_URL_LIFETIME_SECONDS = 15 * 60;

export const SESSION_COOKIE_NAME = "photobook_session";
export const GRID_SIZE_COOKIE_NAME = "photobook_grid_size";
export const ALBUM_SORT_COOKIE_NAME = "photobook_album_sort";
export const PREFERENCE_COOKIE_LIFETIME_SECONDS = 365 * 24 * 60 * 60;
export const SESSION_LIFETIME_SECONDS = 30 * 24 * 60 * 60;
export const OAUTH_STATE_COOKIE_NAME = "photobook_oauth_state";
export const OAUTH_VERIFIER_COOKIE_NAME = "photobook_oauth_verifier";
export const OAUTH_COOKIE_LIFETIME_SECONDS = 10 * 60;
export const GOOGLE_OAUTH_SCOPES = ["openid", "email"];
export const GOOGLE_CALLBACK_PATH = "/auth/google/callback";

// Album passwords are short, so each wrong guess waits a moment to make
// guessing them one by one slow.
export const WRONG_PASSWORD_DELAY_MS = 1000;

export const UPLOAD_CONCURRENCY = 3;
// Uploaded photos are added to the album in groups, so closing the tab
// mid-upload loses at most one group.
export const UPLOAD_SAVE_BATCH_SIZE = 12;
