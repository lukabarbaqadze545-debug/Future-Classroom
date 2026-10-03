/**
 * Writes the problem book as a Word file (WordprocessingML written by hand,
 * zipped with jszip): cover, front matter, chapters with their problems,
 * then the hints, then the solutions, then the back matter and indexes.
 * Headings carry Word's heading styles, so the file has a navigation pane
 * in Word and a contents list on the site.
 */
import JSZip from "jszip";
import type { Block, Book, Chapter, Matter, Problem } from "./parse";

const TEXT_WIDTH = 9638; // A4 with 2 cm margins, in twips
const BLUE = "1F3864";
const GREY = "666666";
const CODE_FILL = "F2F2F2";
const FONT_CODE = "Consolas";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface RunStyle {
  bold?: boolean;
  italic?: boolean;
  color?: string;
  size?: number;
  code?: boolean;
}

function rPr(s: RunStyle): string {
  const parts: string[] = [];
  if (s.code) parts.push(`<w:rFonts w:ascii="${FONT_CODE}" w:hAnsi="${FONT_CODE}" w:cs="${FONT_CODE}" w:eastAsia="${FONT_CODE}"/>`);
  if (s.bold) parts.push("<w:b/><w:bCs/>");
  if (s.italic) parts.push("<w:i/><w:iCs/>");
  if (s.color) parts.push(`<w:color w:val="${s.color}"/>`);
  if (s.size) parts.push(`<w:sz w:val="${s.size}"/><w:szCs w:val="${s.size}"/>`);
  if (s.code && !s.size) parts.push('<w:sz w:val="20"/><w:szCs w:val="20"/>');
  if (s.code) parts.push(`<w:shd w:val="clear" w:color="auto" w:fill="${CODE_FILL}"/>`);
  return parts.length ? `<w:rPr>${parts.join("")}</w:rPr>` : "";
}

function run(text: string, style: RunStyle = {}): string {
  return `<w:r>${rPr(style)}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}

/** `code` and **bold** inside a sentence. */
function inline(text: string, base: RunStyle = {}): string {
  return text
    .split(/(`[^`]+`|\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((piece) => {
      if (piece.startsWith("`")) return run(piece.slice(1, -1), { ...base, code: true });
      if (piece.startsWith("**")) return run(piece.slice(2, -2), { ...base, bold: true });
      return run(piece, base);
    })
    .join("");
}

interface ParaOptions {
  style?: string;
  after?: number;
  before?: number;
  line?: number;
  left?: number;
  hanging?: number;
  jc?: "center" | "left";
  fill?: string;
  keepNext?: boolean;
  keepLines?: boolean;
  pageBreakBefore?: boolean;
  leftBar?: boolean;
}

function para(inner: string, o: ParaOptions = {}): string {
  const p: string[] = [];
  if (o.style) p.push(`<w:pStyle w:val="${o.style}"/>`);
  if (o.keepNext) p.push("<w:keepNext/>");
  if (o.keepLines) p.push("<w:keepLines/>");
  if (o.pageBreakBefore) p.push("<w:pageBreakBefore/>");
  if (o.leftBar) p.push(`<w:pBdr><w:left w:val="single" w:sz="18" w:space="6" w:color="2F5496"/></w:pBdr>`);
  if (o.fill) p.push(`<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>`);
  if (o.after !== undefined || o.before !== undefined || o.line !== undefined) {
    p.push(`<w:spacing${o.before !== undefined ? ` w:before="${o.before}"` : ""}${o.after !== undefined ? ` w:after="${o.after}"` : ""}${o.line !== undefined ? ` w:line="${o.line}" w:lineRule="auto"` : ""}/>`);
  }
  if (o.left !== undefined || o.hanging !== undefined) p.push(`<w:ind${o.left !== undefined ? ` w:left="${o.left}"` : ""}${o.hanging !== undefined ? ` w:hanging="${o.hanging}"` : ""}/>`);
  if (o.jc) p.push(`<w:jc w:val="${o.jc}"/>`);
  return `<w:p>${p.length ? `<w:pPr>${p.join("")}</w:pPr>` : ""}${inner}</w:p>`;
}

const heading = (level: 1 | 2 | 3, text: string, pageBreak = false) => para(run(text), { style: `Heading${level}`, pageBreakBefore: pageBreak });

const tab = () => "<w:r><w:tab/></w:r>";

const body = (text: string, o: ParaOptions = {}) => para(inline(text), o);

/** One paragraph per code line: the text index keeps lines apart, and shaded neighbours read as one block. */
function codeLines(code: string, o: { fill?: string; keep?: boolean } = {}): string {
  const lines = code.replace(/\t/g, "    ").split("\n");
  const keep = o.keep ?? lines.length <= 28;
  return lines
    .map((line, i) =>
      para(run(line === "" ? " " : line, { code: true, size: 19 }), {
        fill: o.fill ?? CODE_FILL,
        after: i === lines.length - 1 ? 160 : 0,
        before: 0,
        line: 252,
        left: 160,
        keepNext: keep && i < lines.length - 1,
        keepLines: true,
        leftBar: true,
      }),
    )
    .join("");
}

function label(text: string): string {
  return para(run(text, { bold: true, color: BLUE, size: 21 }), { before: 100, after: 40, keepNext: true });
}

function blocksXml(blocks: Block[], codeLabel?: (lang: string) => string | null): string {
  return blocks
    .map((b) => {
      switch (b.kind) {
        case "p":
          return body(b.text, { after: 120, line: 288 });
        case "ul":
          return b.items.map((t) => para(run("•") + tab() + inline(t), { left: 420, hanging: 260, after: 60, line: 276 })).join("");
        case "ol":
          return b.items.map((t, i) => para(run(`${i + 1}.`) + tab() + inline(t), { left: 420, hanging: 320, after: 60, line: 276 })).join("");
        case "code": {
          const l = codeLabel?.(b.lang);
          return (l ? label(l) : "") + codeLines(b.code);
        }
      }
    })
    .join("");
}

const BORDER = (c: string) => `<w:top w:val="single" w:sz="4" w:space="0" w:color="${c}"/><w:left w:val="single" w:sz="4" w:space="0" w:color="${c}"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="${c}"/><w:right w:val="single" w:sz="4" w:space="0" w:color="${c}"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="${c}"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="${c}"/>`;

function cell(width: number, content: string, fill?: string): string {
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>` : ""}</w:tcPr>${content}</w:tc>`;
}

function table(widths: number[], rows: { cells: string[]; header?: boolean }[]): string {
  const grid = widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("");
  const trs = rows
    .map(
      (r) =>
        `<w:tr><w:trPr><w:cantSplit/>${r.header ? "<w:tblHeader/>" : ""}</w:trPr>${r.cells.map((c, i) => cell(widths[i], c, r.header ? "D9E2F3" : undefined)).join("")}</w:tr>`,
    )
    .join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblBorders>${BORDER("BFBFBF")}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${trs}</w:tbl>`;
}

const cellText = (text: string, o: RunStyle = {}) => para(inline(text, o), { after: 0, line: 264 });

function cellCode(code: string): string {
  const lines = code === "" ? ["(ცარიელია)"] : code.replace(/\t/g, "    ").split("\n");
  return lines.map((l) => para(run(l === "" ? " " : l, { code: true, size: 19 }), { after: 0, before: 0, line: 252 })).join("");
}

const levelDots = (n: number) => "●".repeat(n) + "○".repeat(5 - n);

function metaLine(p: Problem): string {
  const kind = p.kind === "predict" ? " · ვარაუდი" : p.kind === "debug" ? " · შეცდომის პოვნა" : "";
  return para(run(`სირთულე ${levelDots(p.level)} (${p.level}/5)${kind} · თემები: ${p.tags.join(", ")}`, { color: GREY, size: 18 }), { after: 120, keepNext: true });
}

function exampleTable(p: Problem): string {
  return p.examples
    .map((ex, i) => {
      const title = p.examples.length > 1 ? `მაგალითი ${i + 1}` : "მაგალითი";
      const rows = [{ header: true, cells: [cellText("შეყვანა", { bold: true, size: 20 }), cellText("გამოტანა", { bold: true, size: 20 })] }, { cells: [cellCode(ex.input), cellCode(ex.output)] }];
      const note = ex.note.length ? blocksXml(ex.note.map((b, j) => (j === 0 && b.kind === "p" ? { ...b, text: `**განმარტება.** ${b.text}` } : b))) : "";
      return label(title) + table([TEXT_WIDTH / 2, TEXT_WIDTH / 2], rows) + para("", { after: 60 }) + note;
    })
    .join("");
}

function problemXml(p: Problem): string {
  const shown = (lang: string) => (lang === "in" ? "პროგრამის შეყვანა" : null);
  let x = heading(2, `${p.id}. ${p.title}`) + metaLine(p) + blocksXml(p.statement, shown);
  if (p.input.length) x += label("შეყვანა") + blocksXml(p.input);
  if (p.output.length) x += label("გამოტანა") + blocksXml(p.output);
  if (p.limits.length) x += label("შეზღუდვები") + blocksXml(p.limits);
  if (p.kind !== "predict") x += exampleTable(p);
  return x;
}

function chapterXml(c: Chapter): string {
  return heading(1, `თავი ${c.number}. ${c.title}`, true) + blocksXml(c.intro) + c.problems.map(problemXml).join("");
}

const HINT_LABELS = ["მინიშნება 1", "მინიშნება 2", "მინიშნება 3"];

function hintsXml(chapters: Chapter[]): string {
  return chapters
    .map(
      (c) =>
        heading(2, `თავი ${c.number}. ${c.title}`) +
        c.problems
          .map(
            (p) =>
              para(run(`${p.id}. ${p.title}`, { bold: true, color: BLUE }), { before: 160, after: 40, keepNext: true }) +
              p.hints.map((h, i) => para(run(`${HINT_LABELS[i]}. `, { bold: true, color: GREY }) + inline(h), { left: 240, after: 60, line: 276 })).join(""),
          )
          .join(""),
    )
    .join("");
}

function solutionsXml(chapters: Chapter[]): string {
  return chapters
    .map(
      (c) =>
        heading(2, `თავი ${c.number}. ${c.title}`) +
        c.problems
          .map((p) => {
            const answer = p.solution.answer !== null ? label("პასუხი (პროგრამის გამოტანა)") + codeLines(p.solution.answer) : "";
            const code = p.solution.code !== null ? codeLines(p.solution.code) : "";
            return para(run(`${p.id}. ${p.title}`, { bold: true, color: BLUE }), { before: 200, after: 60, keepNext: true }) + answer + code + blocksXml(p.solution.text);
          })
          .join(""),
    )
    .join("");
}

function matterXml(m: Matter, pageBreak = true): string {
  return heading(1, m.title, pageBreak) + blocksXml(m.lead) + m.sections.map((s) => heading(2, s.title) + blocksXml(s.blocks)).join("");
}

function chapterTable(chapters: Chapter[]): string {
  const widths = [700, 4338, 1200, 1700, 1700];
  const head = ["თავი", "თემა", "ამოცანები", "ნომრები", "კვირა"].map((t) => cellText(t, { bold: true, size: 20 }));
  const rows = chapters.map((c) => [String(c.number), c.title, String(c.problems.length), `${c.number}.1–${c.number}.${c.problems.length}`, c.weeks || "—"].map((t) => cellText(t, { size: 20 })));
  return table(widths, [{ header: true, cells: head }, ...rows.map((cells) => ({ cells }))]);
}

function tagIndex(chapters: Chapter[]): string {
  const byTag = new Map<string, string[]>();
  for (const c of chapters) for (const p of c.problems) for (const t of p.tags) byTag.set(t, [...(byTag.get(t) ?? []), p.id]);
  return [...byTag.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "ka"))
    .map(([tag, ids]) => para(run(`${tag}. `, { bold: true }) + run(ids.join(", ")), { after: 60, line: 276, left: 240, hanging: 240 }))
    .join("");
}

function levelIndex(chapters: Chapter[]): string {
  const names = ["პირველი ნაბიჯები", "საფუძვლები", "საშუალო", "რთული", "ოლიმპიადური"];
  return [1, 2, 3, 4, 5]
    .map((level) => {
      const items = chapters.flatMap((c) => c.problems.filter((p) => p.level === level).map((p) => p.id));
      return para(run(`${level}. ${names[level - 1]} (${items.length}). `, { bold: true }) + run(items.join(", ") || "—"), { after: 80, line: 276, left: 240, hanging: 240 });
    })
    .join("");
}

export interface BookInfo {
  title: string;
  subtitle: string;
  edition: string;
}

export function bookXml(book: Book, info: BookInfo): string {
  const total = book.chapters.reduce((n, c) => n + c.problems.length, 0);
  const cover =
    para(run(info.title, { bold: true, color: BLUE, size: 56 }), { before: 2400, after: 200, jc: "center" }) +
    para(run(info.subtitle, { italic: true, color: "444444", size: 28 }), { after: 2000, jc: "center" }) +
    para(run(info.edition, { color: GREY, size: 24 }), { before: 3200, jc: "center", after: 120 }) +
    para(run(`${total} ამოცანა · ${book.chapters.length} თავი`, { color: GREY, size: 22 }), { jc: "center" });
  const front = book.front.map((m, i) => matterXml(m, true) + (i === 0 ? heading(2, "თავები") + chapterTable(book.chapters) : "")).join("");
  const chapters = book.chapters.map(chapterXml).join("");
  const hints =
    heading(1, "მინიშნებები", true) +
    body("მინიშნება წაიკითხეთ მხოლოდ მაშინ, როცა ამოცანაზე უკვე იმუშავეთ. ჯერ პირველი; თუ ის საკმარისია, დანარჩენი არ გჭირდებათ. ნომრები ამოცანების ნომრებს ემთხვევა.", { after: 160, line: 288 }) +
    hintsXml(book.chapters);
  const solutions =
    heading(1, "ამოხსნები", true) +
    body("ეს ამოხსნები ერთ-ერთი შესაძლო გზაა და არა ერთადერთი. თქვენი პროგრამა შეიძლება სხვანაირი იყოს და მაინც სწორად მუშაობდეს; ის შეადარეთ მაგალითებსა და საკუთარ ტესტებს. ყველა ამოხსნა გადამოწმებულია: კომპილაცია, მაგალითები და, სადაც საჭირო იყო, შედარება სრულ გადარჩევასთან.", {
      after: 160,
      line: 288,
    }) +
    solutionsXml(book.chapters);
  const back = book.back.map((m) => matterXml(m, true)).join("");
  const indexes = heading(1, "ამოცანების საძიებელი", true) + heading(2, "თემების მიხედვით") + tagIndex(book.chapters) + heading(2, "სირთულის მიხედვით") + levelIndex(book.chapters);
  return cover + front + chapters + hints + solutions + back + indexes;
}

const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles ${NS}>
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri" w:eastAsia="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="ka-GE" w:eastAsia="ka-GE" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="288" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="200" w:after="240"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:bCs/><w:color w:val="${BLUE}"/><w:sz w:val="40"/><w:szCs w:val="40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="360" w:after="100"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:bCs/><w:color w:val="2F5496"/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:bCs/><w:color w:val="2F5496"/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style>
</w:styles>`;

const FOOTER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr ${NS}><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:fldSimple w:instr=" PAGE "><w:r><w:rPr><w:color w:val="${GREY}"/><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>`;

export async function buildDocx(book: Book, info: BookInfo): Promise<Uint8Array> {
  const zip = new JSZip();
  const add = (name: string, data: string) => zip.file(name, data, { createFolders: false });
  add(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`,
  );
  add(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
  );
  add(
    "docProps/core.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(info.title)}</dc:title><dc:language>ka-GE</dc:language></cp:coreProperties>`,
  );
  add(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>`,
  );
  add("word/styles.xml", STYLES);
  add("word/footer1.xml", FOOTER);
  add(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${NS}><w:body>${bookXml(book, info)}<w:sectPr><w:footerReference w:type="default" r:id="rId2"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`,
  );
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
