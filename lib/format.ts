const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formats integer cents as a USD price; 0 renders as "Free". */
export function formatPrice(priceCents: number) {
  return priceCents === 0 ? "Free" : usd.format(priceCents / 100);
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
