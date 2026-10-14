/**
 * Which part of the platform a page belongs to, for the teacher's classroom
 * view ("Programming Lab", "Library" …). Pure, so the client can use it.
 */
export const AREAS = [
  "home",
  "subjects",
  "lesson",
  "quiz",
  "session",
  "programming",
  "stem",
  "research",
  "critical",
  "labs",
  "library",
  "assistant",
  "career",
  "assignments",
  "progress",
  "account",
  "join",
  "other",
] as const;
export type Area = (typeof AREAS)[number];

const PREFIXES: [string, Area][] = [
  ["/labs/programming", "programming"],
  ["/labs/stem", "stem"],
  ["/labs/research", "research"],
  ["/labs/critical-thinking", "critical"],
  ["/labs", "labs"],
  ["/student/learn", "lesson"],
  ["/student/quizzes", "quiz"],
  ["/student/assignments", "assignments"],
  ["/student/progress", "progress"],
  ["/student/library", "library"],
  ["/student", "home"],
  ["/subjects", "subjects"],
  ["/session", "session"],
  ["/join", "join"],
  ["/library", "library"],
  ["/learning-assistant", "assistant"],
  ["/career", "career"],
  ["/portfolio", "career"],
  ["/account", "account"],
];

export function areaOf(path: string): Area {
  for (const [prefix, area] of PREFIXES) if (path === prefix || path.startsWith(`${prefix}/`)) return area;
  return "other";
}

/**
 * A platform page a teacher may send students to: a path on this server,
 * never another site, a protocol-relative URL or an API endpoint.
 */
export function isPlatformPath(path: string): boolean {
  return /^\/(?!\/)[^\s\\]*$/.test(path) && path.length <= 300 && !/^\/api(\/|$|\?)/.test(path) && !path.includes("://");
}
