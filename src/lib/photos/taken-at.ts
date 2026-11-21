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

