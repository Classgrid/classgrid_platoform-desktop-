import { format, parseISO, isValid } from "date-fns";

/**
 * Returns the current date in ISO format, dropping the time.
 */
export function getCurrentDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Formats a date object or ISO string into a standard display string.
 * e.g. "12 Jan, 2024"
 */
export function formatDate(date: string | Date | undefined | null, formatStr: string = "dd MMM, yyyy"): string {
  if (!date) return "—";
  
  try {
    const parsed = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(parsed)) return "Invalid Date";
    return format(parsed, formatStr);
  } catch (err) {
    return "Invalid Date";
  }
}

/**
 * Formats a date object or ISO string into a standard time display string.
 * e.g. "14:30" or "02:30 PM"
 */
export function formatTime(date: string | Date | undefined | null, formatStr: string = "hh:mm a"): string {
  if (!date) return "—";

  try {
    const parsed = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(parsed)) return "Invalid Time";
    return format(parsed, formatStr);
  } catch (err) {
    return "Invalid Time";
  }
}
