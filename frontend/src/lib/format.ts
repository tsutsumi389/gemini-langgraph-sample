const hmFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatHm(ms: number): string {
  return hmFormatter.format(new Date(ms));
}
