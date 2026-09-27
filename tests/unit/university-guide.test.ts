import { beforeEach, describe, expect, it } from "vitest";
import { freshDb, makeUser } from "../helpers";
import { en } from "@/lib/i18n/en";
import { ka } from "@/lib/i18n/ka";
import { FIELD_IDS } from "@/lib/labs/career/careers";
import { createCard, isStale, listOwnCards, universitySchema } from "@/lib/labs/career/service";
import {
  ABROAD_STEPS,
  CAREER_FIELD,
  CHECKED,
  FIELD_GUIDES,
  GEORGIA_2026,
  GUIDE_CHECKED_AT,
  GUIDE_FIELDS,
  REGIONS,
  UNIVERSITY_GUIDE,
  getUniversity,
  guideCard,
  guideIsStale,
} from "@/lib/labs/career/universities";

const GEORGIAN = /[ა-ჿ]/;
const DAY = 86_400_000;

/** The Georgian side of every {en, ka} pair in a tree. */
function georgianSides(tree: unknown, where: string): { where: string; text: string }[] {
  if (Array.isArray(tree)) return tree.flatMap((v, i) => georgianSides(v, `${where}[${i}]`));
  if (tree && typeof tree === "object") {
    const r = tree as Record<string, unknown>;
    if (typeof r.en === "string" && typeof r.ka === "string" && Object.keys(r).length === 2) return [{ where, text: r.ka }];
    return Object.entries(r).flatMap(([k, v]) => georgianSides(v, `${where}.${k}`));
  }
  return [];
}

describe("university guide data", () => {
  it("lists at least 20 universities, in Georgia and around the world, with unique ids", () => {
    expect(UNIVERSITY_GUIDE.length).toBeGreaterThanOrEqual(20);
    expect(new Set(UNIVERSITY_GUIDE.map((u) => u.id)).size).toBe(UNIVERSITY_GUIDE.length);
    for (const region of REGIONS) expect(UNIVERSITY_GUIDE.filter((u) => u.region === region).length, region).toBeGreaterThanOrEqual(2);
    // Every field has choices at home and abroad.
    for (const field of GUIDE_FIELDS) {
      const offering = UNIVERSITY_GUIDE.filter((u) => u.fields.includes(field));
      expect(offering.some((u) => u.region === "georgia"), field).toBe(true);
      expect(offering.filter((u) => u.region !== "georgia").length, field).toBeGreaterThanOrEqual(4);
    }
  });

  it("gives every university the full picture, with official sources", () => {
    for (const u of UNIVERSITY_GUIDE) {
      expect(u.fields.length, u.id).toBeGreaterThan(0);
      for (const f of u.fields) expect(u.strengths[f], `${u.id}.${f}`).toBeDefined();
      expect(u.admission.length, u.id).toBeGreaterThan(0);
      expect(u.funding.length, u.id).toBeGreaterThan(0);
      expect(u.tuition.en.length, u.id).toBeGreaterThan(20);
      expect(u.deadlines.en.length, u.id).toBeGreaterThan(10);
      expect(u.website, u.id).toMatch(/^https:\/\//);
      expect(u.sources.length, u.id).toBeGreaterThan(0);
      for (const s of u.sources) {
        expect(s.url, u.id).toMatch(/^https:\/\/[^\s]+$/);
        expect(s.label.trim(), u.id).not.toBe("");
      }
    }
  });

  it("describes Georgia after the 2025–2026 reform, not the old grant system", () => {
    const georgian = UNIVERSITY_GUIDE.filter((u) => u.region === "georgia");
    for (const u of georgian) {
      const text = JSON.stringify(u);
      // The old national grant tiers must only ever be mentioned as abolished.
      if (/100%, 70%|100 %, 70 %/.test(text)) expect(text, u.id).toMatch(/abolished|გაუქმდა/);
    }
    expect(JSON.stringify(GEORGIA_2026)).toMatch(/17 December 2025/);
    expect(GEORGIA_2026.sources.length).toBeGreaterThan(0);
    // Only the private university is private.
    expect(georgian.filter((u) => u.kind === "private").map((u) => u.id)).toEqual(["freeuni"]);
  });

  it("compares fields using only universities that exist and teach that field", () => {
    expect(FIELD_GUIDES.map((f) => f.id).sort()).toEqual([...GUIDE_FIELDS].sort());
    for (const guide of FIELD_GUIDES) {
      expect(guide.paths.length, guide.id).toBeGreaterThanOrEqual(3);
      for (const path of guide.paths) {
        for (const id of path.universities) {
          const u = getUniversity(id);
          expect(u, `${guide.id}: ${id}`).not.toBeNull();
          expect(u!.fields, `${guide.id}: ${id}`).toContain(guide.id);
        }
      }
    }
    for (const s of ABROAD_STEPS.scholarships) expect(s.source.url).toMatch(/^https:\/\//);
  });

  it("is written in Georgian on the Georgian side, with Georgian number formatting", () => {
    const sides = georgianSides([UNIVERSITY_GUIDE, FIELD_GUIDES, GEORGIA_2026, ABROAD_STEPS], "guide");
    expect(sides.length).toBeGreaterThan(300);
    expect(sides.filter((s) => !GEORGIAN.test(s.text)).map((s) => `${s.where}: ${s.text}`)).toEqual([]);
    // Thousands are separated by a space, not a comma; no decimal points.
    expect(sides.filter((s) => /\d,\d{3}\b|\d\.\d/.test(s.text)).map((s) => `${s.where}: ${s.text}`)).toEqual([]);
    // Students are addressed as „შენ“, never as „თქვენ“.
    expect(sides.filter((s) => /თქვენ/.test(s.text)).map((s) => s.where)).toEqual([]);
  });

  it("maps guide fields to career explorer fields that exist", () => {
    for (const f of GUIDE_FIELDS) {
      const id = CAREER_FIELD[f];
      if (id) expect(FIELD_IDS).toContain(id);
    }
    expect(Object.keys(en.labs.career.guide.fieldNames).sort()).toEqual([...GUIDE_FIELDS].sort());
    expect(Object.keys(ka.labs.career.guide.fieldNames).sort()).toEqual([...GUIDE_FIELDS].sort());
  });

  it("says when it was checked, and warns after a year", () => {
    expect(Number.isNaN(Date.parse(CHECKED))).toBe(false);
    const checked = Date.parse(`${CHECKED}T00:00:00Z`);
    expect(guideIsStale(checked + 30 * DAY)).toBe(false);
    expect(guideIsStale(checked + 400 * DAY)).toBe(true);
  });
});

describe("saving a guide entry to my university research", () => {
  beforeEach(() => freshDb());

  it("builds a valid card in the student's language, dated with the check", () => {
    for (const u of UNIVERSITY_GUIDE) {
      for (const locale of ["en", "ka"] as const) {
        const input = guideCard(u, null, locale, (locale === "en" ? en : ka).labs.career.guide.fieldNames);
        expect(universitySchema.safeParse(input).success, `${u.id} ${locale}`).toBe(true);
      }
    }
    const student = makeUser("student", "mariam");
    const tsu = getUniversity("tsu")!;
    const card = createCard(student, guideCard(tsu, null, "ka", ka.labs.career.guide.fieldNames), { checkedAt: GUIDE_CHECKED_AT });
    expect(card.university).toBe("ივანე ჯავახიშვილის სახელობის თბილისის სახელმწიფო უნივერსიტეტი (თსუ)");
    expect(card.program).toBe("კომპიუტერული მეცნიერება");
    expect(card.fieldId).toBe("computer_science");
    expect(card.tuition).toContain("უფასოა");
    expect(card.website).toBe(tsu.website);
    expect(card.checkedAt).toBe(GUIDE_CHECKED_AT);
    expect(isStale(card, GUIDE_CHECKED_AT + 30 * DAY)).toBe(false);
    expect(listOwnCards(student.id).map((c) => c.id)).toEqual([card.id]);
  });

  it("uses the field asked for only when the university teaches it", () => {
    const oxford = getUniversity("oxford")!;
    const names = en.labs.career.guide.fieldNames;
    expect(guideCard(oxford, "medicine", "en", names)).toMatchObject({ program: names.medicine, fieldId: "medicine_health", university: "University of Oxford" });
    expect(guideCard(oxford, null, "en", names)).toMatchObject({ program: "", fieldId: null });
    expect(guideCard(oxford, "art", "en", names)).toMatchObject({ program: "", fieldId: null });
    expect(guideCard(getUniversity("mit")!, "art", "en", names)).toMatchObject({ program: names.cs, fieldId: "computer_science" });
  });
});
