const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formats integer cents as USD, e.g. 4825000 → "$48,250". */
export function formatUsd(cents: number) {
  return usd.format(cents / 100);
}

/** Formats integer cents as a USD price; 0 renders as "Free". */
export function formatPrice(priceCents: number) {
  return priceCents === 0 ? "Free" : formatUsd(priceCents);
}

export function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

/** Full number with grouping, e.g. 1284 → "1,284". */
export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Video length as a clock, e.g. 754 → "12:34". */
export function formatClock(totalSeconds: number) {
  const seconds = Math.round(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

/** A timestamp as e.g. "Oct 25, 2026, 3:42 PM". Render it client-side only, as it uses the viewer's time zone. */
export function formatDateTime(timestamp: number) {
  return dateTime.format(timestamp);
}

const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

/** A timestamp's date, e.g. "Oct 25, 2026". Client-side only, like formatDateTime. */
export function formatDate(timestamp: number) {
  return date.format(timestamp);
}
