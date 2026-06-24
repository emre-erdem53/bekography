import { format } from "date-fns";

/** HTML date input (YYYY-MM-DD) → local calendar date at midnight. */
export function parseDateOnlyInput(value: string): Date {
  const datePart = value.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** DB / ISO date → YYYY-MM-DD for `<input type="date">`. */
export function toDateInputValue(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Format a date-only value for display in admin lists. */
export function formatDateOnlyDisplay(
  value: string | Date,
  pattern = "d MMM yyyy",
): string {
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? parseDateOnlyInput(value)
      : typeof value === "string"
        ? new Date(value)
        : value;
  return format(date, pattern);
}

export function dateOnlyToIsoDate(value: string): string {
  return toDateInputValue(parseDateOnlyInput(value));
}
