/**
 * Short random ids for items created in the browser. Uses Math.random because
 * crypto.randomUUID is unavailable on plain-HTTP school networks (it requires
 * a secure context). Uniqueness only matters within one lesson.
 */
export function clientId(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10);
}
