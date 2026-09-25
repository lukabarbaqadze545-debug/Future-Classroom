/**
 * Output comparison used by every checker (browser runs, self-checks and a
 * server judge): line endings, trailing spaces and trailing blank lines are
 * ignored; everything else must match exactly.
 */
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "")
    .replace(/^\n+/, "");
}

export function outputsMatch(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}
