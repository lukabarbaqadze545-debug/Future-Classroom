import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/en";
import { ka } from "@/lib/i18n/ka";
import { fmt, fmtCount } from "@/lib/i18n/config";

type Tree = { [key: string]: unknown };

function leaves(tree: unknown, prefix = ""): [string, string][] {
  if (typeof tree === "string") return [[prefix, tree]];
  if (Array.isArray(tree)) return tree.flatMap((item, i) => leaves(item, `${prefix}[${i}]`));
  return Object.entries(tree as Tree).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("dictionaries", () => {
  const enLeaves = new Map(leaves(en).map(([k, v]) => [k.replace(/\[\d+\]/g, "[]"), v]));
  const kaLeaves = leaves(ka);

  it("Georgian covers every English key (arrays may differ in length)", () => {
    const kaKeys = new Set(kaLeaves.map(([k]) => k.replace(/\[\d+\]/g, "[]")));
    const missing = [...enLeaves.keys()].filter((k) => !kaKeys.has(k));
    expect(missing).toEqual([]);
  });

  it("has no empty strings and keeps placeholders consistent", () => {
    for (const [key, value] of kaLeaves) {
      expect(value.trim(), key).not.toBe("");
      const english = enLeaves.get(key.replace(/\[\d+\]/g, "[]"));
      if (english !== undefined && !key.includes("[")) expect(placeholders(value), key).toEqual(placeholders(english));
    }
  });

  it("formats placeholders and plurals", () => {
    expect(fmt("Hi {name}", { name: "Ana" })).toBe("Hi Ana");
    expect(fmtCount(en.teacher.dashboard.participants, 1)).toBe("1 student");
    expect(fmtCount(en.teacher.dashboard.participants, 3)).toBe("3 students");
    expect(fmtCount(ka.teacher.dashboard.participants, 3)).toBe("3 მოსწავლე");
  });
});
