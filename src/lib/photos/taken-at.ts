const padTwoDigits = (value: number): string => String(value).padStart(2, "0");

/**
 * Cameras record local time with no time zone, and EXIF readers hand it back as
 * a Date in the browser's zone. Reading the local parts back out keeps the time
 * the camera showed.
 */
export const formatLocalDateTime = (date: Date): string => {
  const datePart = [date.getFullYear(), padTwoDigits(date.getMonth() + 1), padTwoDigits(date.getDate())].join("-");
  const timePart = [date.getHours(), date.getMinutes(), date.getSeconds()].map(padTwoDigits).join(":");
  return `${datePart}T${timePart}`;
};

/** "June 27, 2026 · 7:27 PM" — read as local time, so it shows what the camera showed. */
export const describeTakenAt = (takenAt: string | null): string | null => {
  if (!takenAt) return null;

  const date = new Date(takenAt);
  if (Number.isNaN(date.getTime())) return null;

  const day = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
};
