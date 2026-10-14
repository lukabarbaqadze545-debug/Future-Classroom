/** Midnight of the current day on the school server, in milliseconds. */
export function startOfToday(at = Date.now()): number {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
