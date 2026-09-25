import { describe, expect, it } from "vitest";
import { normalizeJoinCode } from "@/lib/domain/ids";
import { buildFtsQuery, tokenizeQuery } from "@/lib/files/search-query";
import { chunkPages, stripMarkdown } from "@/lib/files/chunk";
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
  it("drops stop words and FTS operators", () => {
    expect(tokenizeQuery("What does our physics material say about Newton's second law?")).toEqual(["physics", "newton", "second", "law"]);
    const q = buildFtsQuery('force" OR * NEAR( -- drop')!;
    expect(q).not.toMatch(/NEAR\(|--/);
    expect(q.split(" OR ").every((part) => /^"[^"]+"\*?$/.test(part))).toBe(true);
  });
  it("prefix-matches long Georgian words to handle case endings", () => {
    expect(buildFtsQuery("ნიუტონის კანონი")).toBe('"ნიუტო"* OR "კანო"*');
  });
  it("returns null when nothing searchable remains", () => {
    expect(buildFtsQuery("what is the?")).toBeNull();
  });
});

describe("chunking", () => {
  it("starts a new chunk at each heading and strips Markdown", () => {
    const chunks = chunkPages([{ page: null, text: "# Title\n\nIntro text.\n\n## Second law\nF = m · a is **important**.\n\n## Third law\nPairs of forces." }]);
    expect(chunks.map((c) => c.content)).toEqual(["Title\n\nIntro text.", "Second law\nF = m · a is important.", "Third law\nPairs of forces."]);
  });
  it("splits long paragraphs by sentence", () => {
    const text = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} is here.`).join(" ");
    const chunks = chunkPages([{ page: 3, text }], 200);
    expect(chunks.length).toBeGreaterThan(3);
    expect(chunks.every((c) => c.content.length <= 230 && c.page === 3)).toBe(true);
  });
  it("converts list markers", () => {
    expect(stripMarkdown("- one\n* two")).toBe("• one\n• two");
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
