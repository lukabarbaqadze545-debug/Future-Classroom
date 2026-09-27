import "server-only";
import type { MaterialVisibility } from "@/lib/domain/catalog";
import type { CurrentUser } from "@/lib/auth/session";

/**
 * Who may see a material — one rule for listing, opening and searching.
 * Students see materials marked "students"; teachers see everything shared
 * with teachers or students plus their own private files; administrators see
 * everything. Used as an SQL condition on the `materials m` alias.
 */
export function visibilityClause(user: CurrentUser): { sql: string; params: string[] } {
  if (user.role === "admin") return { sql: "1 = 1", params: [] };
  if (user.role === "teacher") return { sql: "(m.visibility IN ('teachers','students') OR m.owner_id = ?)", params: [user.id] };
  return { sql: "m.visibility = 'students'", params: [] };
}

export function canView(material: { ownerId: string; visibility: MaterialVisibility }, user: CurrentUser): boolean {
  if (user.role === "admin" || material.ownerId === user.id) return true;
  if (user.role === "teacher") return material.visibility !== "private";
  return material.visibility === "students";
}
