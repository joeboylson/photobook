import { PREFERENCE_COOKIE_LIFETIME_SECONDS } from "@/lib/constants";

/** Remembers a view choice in this browser. The server reads it back so pages arrive already set. */
export const writePreferenceCookie = (name: string, value: string): void => {
  document.cookie = `${name}=${value}; path=/; max-age=${PREFERENCE_COOKIE_LIFETIME_SECONDS}; samesite=lax`;
};
