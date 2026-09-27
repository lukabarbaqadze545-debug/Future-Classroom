import { describe, expect, it } from "vitest";
import { normalizeJoinCode } from "@/lib/domain/ids";
import { contentTerms, ftsQuery, kaStem, uniqueTerms } from "@/lib/knowledge/language";
import { ingestDocument, stripInlineMarkdown } from "@/lib/knowledge/ingest";
import { sanitizeFileName, validateUpload } from "@/lib/files/validate";
import { ApiError } from "@/lib/http/errors";

describe("normalizeJoinCode", () => {
  it.each([
    ["fc-4821", "FC-4821"],
    ["FC4821", "FC-4821"],
    [" 4821 ", "FC-4821"],
    ["fc 48 21", "FC-4821"],
  ])("%s → %s", (input, expected) => expect(normalizeJoinCode(input)).toBe(expected));
  it("rejects malformed codes", () => {
    expect(normalizeJoinCode("FC-48")).toBeNull();
    expect(normalizeJoinCode("hello")).toBeNull();
  });
});

describe("FTS query building", () => {
  it("drops stop words and can never carry FTS operators", () => {
    expect(contentTerms("What does our physics material say about Newton's second law?")).toEqual(["physic", "newton", "second", "law"]);
    const q = ftsQuery(uniqueTerms('force" OR * NEAR( -- drop'))!;
    expect(q).not.toMatch(/NEAR\(|--|\*/);
    expect(q.split(" OR ").every((part) => /^"[\p{L}\p{N}]+"$/u.test(part))).toBe(true);
  });
  it("matches Georgian words by stem, whatever their case ending", () => {
    expect(ftsQuery(uniqueTerms("ნიუტონის კანონი"))).toBe(`"${kaStem("ნიუტონი")}" OR "${kaStem("კანონის")}"`);
  });
  it("returns null when nothing searchable remains", () => {
    expect(ftsQuery(uniqueTerms("what is the?"))).toBeNull();
  });
});

describe("passages", () => {
  it("starts a new passage at each heading, keeps the heading as its section and strips Markdown", () => {
    const { chunks } = ingestDocument([{ page: null, text: "# Title\n\nIntro text.\n\n## Second law\nF = m · a is **important**.\n\n## Third law\nPairs of forces." }], "markdown");
    expect(chunks.map((c) => [c.section, c.text])).toEqual([
      ["Title", "Intro text."],
      ["Second law", "F = m · a is important."],
      ["Third law", "Pairs of forces."],
    ]);
  });
  it("keeps long texts in paragraph-sized passages on their page", () => {
    const text = Array.from({ length: 30 }, (_, i) => `Paragraph ${i} explains one more idea about forces and motion in some detail here.`).join("\n\n");
    const { chunks } = ingestDocument([{ page: 3, text }], "plain");
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.text.length <= 1500 && c.pageStart === 3 && c.pageEnd === 3)).toBe(true);
  });
  it("removes inline Markdown", () => {
    expect(stripInlineMarkdown("**bold**, `code` and [a link](https://example.org)")).toBe("bold, code and a link");
  });
});

describe("upload validation", () => {
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
  it("accepts files whose content matches the extension", () => {
    expect(validateUpload("notes.pdf", pdf).kind).toBe("pdf");
    expect(validateUpload("notes.md", new TextEncoder().encode("# Notes")).kind).toBe("text");
  });
  it("rejects disguised or unsupported files", () => {
    expect(() => validateUpload("virus.pdf", new TextEncoder().encode("MZ binary"))).toThrow(ApiError);
    expect(() => validateUpload("page.html", new TextEncoder().encode("<script>"))).toThrow(ApiError);
    expect(() => validateUpload("doc.docx", pdf)).toThrow(ApiError);
    expect(() => validateUpload("binary.txt", new Uint8Array([0x41, 0x00, 0x42]))).toThrow(ApiError);
    expect(() => validateUpload("empty.txt", new Uint8Array())).toThrow(ApiError);
  });
  it("sanitises file names", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName('C:\\temp\\bad<name>.pdf')).toBe("badname.pdf");
  });
});
