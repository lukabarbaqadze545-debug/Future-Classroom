# Learning Assistant

Status: implemented (2026-09-27). Sections 1–7 are the integration plan written
after inspecting both codebases and before any code was changed; section 8
describes what was built, and where it differs from the plan.

The Learning Assistant brings the strongest learning capabilities of a
separate prototype (a local-first "books" assistant, internally called
*Labo*) into Future Classroom as a native tool. Future Classroom stays the
product: the assistant is one optional tool inside it, not a second app and
not a chatbot.

## 1. What the two codebases are

| | Future Classroom | Prototype (Labo) |
| --- | --- | --- |
| Runtime | Next.js 16 server, SQLite, one process per school | Vite + React single-page app, runs in one browser |
| Users | Students, teachers, administrators; scrypt passwords, server sessions | One person, no accounts |
| Storage | SQLite (`materials`, `material_chunks` + FTS5), uploads on disk | IndexedDB (Dexie) in the browser |
| Materials | Teachers upload PDF/DOCX/TXT/MD; visibility private / teachers / students | The user imports PDFs into their own browser |
| Search | FTS5 BM25, crude prefix "stemming" for Georgian | Georgian morphology (suffix stripping), bilingual concept aliases, BM25 over paragraph chunks |
| Answers | AI summary with [n] citations, or passages only | Deterministic grounded answers from extracted knowledge; optional LLM with claim-by-claim validation |
| AI | Server-side provider abstraction, key in the server environment, optional | Browser calls the vendor API with a key the user pastes in |
| Content | Bilingual lessons, labs, library catalogue | Authored Georgian topic library (facts, people, timeline…) |

## 2. What is imported (rewritten as Future Classroom code)

Nothing is copied wholesale. Each piece is re-implemented in
`src/lib/knowledge/` (pure TypeScript, unit-tested) and wired into the
existing services.

1. **Georgian morphology** — longest-first suffix stripping with a minimum
   stem, two passes, typo distance. Replaces `stemOf()` (fixed-length trim)
   in material search.
2. **Bilingual synonyms** — a curated EN↔KA table of school terms (force ↔
   ძალა, quadratic equation ↔ კვადრატული განტოლება …), used to expand a query
   so a Georgian question also finds English material and the reverse.
   Entries tied to the prototype's own topics are not carried over.
3. **Document ingestion** — cleaning (running heads and feet, page-number
   lines, hyphenation across line breaks, per-page extraction quality),
   structure (chapter/section headings, Markdown headings, Georgian caseless
   headings), paragraph-based chunks that never cross a section and keep
   their exact page range, and an extraction report (quality + warnings).
   PDFs are read line by line from positioned text through the existing
   `unpdf` dependency; DOCX headings through the existing `mammoth`.
4. **Knowledge extraction** — marker-based, conservative: definitions,
   formulas, examples, claims, arguments, objections, replies,
   counterarguments, distinctions — each a sentence of the material itself
   with the page range it came from. Page numbers are never synthesised: a
   document without pages (DOCX, TXT) is cited by section only.
5. **Retrieval** — scope applied before scoring (one material, a subject, or
   everything the user may see), BM25 over stemmed terms with a relative
   floor, section-name boost, extraction-quality weight; knowledge items
   scored by rarity. Built-in and teacher lessons (published sections only —
   never activities, answers or solutions) are searchable too, so the
   assistant is useful in a school that has not uploaded anything yet.
6. **Claim validation** — when AI is used, every sentence the model writes
   is checked against the passages it was given: shared (stemmed) words,
   figures that must appear in the source, citation repair, and four
   outcomes (in the material / conclusion from the material / uncertain /
   not found in the material). Unsupported sentences are shown as such, not
   hidden.
7. **Reasoning cues** — claim types (universal, causal, normative,
   comparative, conditional, definition) and the assumptions each one
   carries, used for the "evidence" and "check my understanding" tools.

## 3. What is not imported, and why

| Prototype feature | Decision |
| --- | --- |
| Browser-side storage (IndexedDB), no accounts | Future Classroom has accounts, permissions and SQLite; one system only. |
| AI key pasted into the browser | Keys stay on the server (`ANTHROPIC_API_KEY`); students never handle keys. |
| Authored Georgian topic library, facts, formulas, people, timeline | Duplicates subjects and lessons; unreviewed and monolingual. Content enters through lessons and the review workflow instead. |
| Free-text conversation engine, chat threads, memories | The assistant offers explicit learning tasks instead of an open chat (Future Classroom is not a chatbot). |
| Document editor (tiptap, docx/pptx export), knowledge graph (cytoscape) | Large dependencies, outside the brief; the Research Lab already covers writing up. |
| Counterfactual "worlds", competitive-programming roadmap, focus timer, daily discovery | Not about working with school materials. The roadmap may suit the Programming Lab later. |
| External research APIs (OpenAlex, NASA, USGS) | Schools run on a local network; sources are entered by people in the Research Lab. |
| Simulations | The STEM Lab has its own. |
| PWA / offline service worker | Future Classroom is served from the school's own server. |

## 4. Where it lives

- Route: `/learning-assistant` (students and staff), in the main navigation.
- The School Library's "Ask" tab embeds the same tool; the old
  `/api/library/ask` endpoint, `askLibrary()` and `LibraryAsk` are removed
  (one search and answer path).
- "Ask about this material" links from the library resource page and the
  teacher's materials list open the assistant scoped to that material.
- "Start a research project" creates a normal Research Lab project with the
  question, the sources (the material or lesson) and the quoted passages
  with their pages.

## 5. The learning tasks

1. **Explain** — definitions, formulas and examples from the material, then
   the best passages; with AI, a short explanation whose every sentence is
   marked by where it comes from.
2. **Where is it?** — the passages that answer the question, with material,
   section and page.
3. **Evidence** — what in the material supports or challenges a statement,
   what kind of statement it is and which assumptions to check.
4. **Check my understanding** — the student writes what they understood;
   each sentence is compared with the material (found / partly / numbers
   differ / may say the opposite / not found — "not found" is not "wrong").
5. **Questions to ask** — questions built from the material's own
   definitions, claims, formulas and sections.
6. **Start research** — a research question, sources and first notes.

Each result offers the next step (understand → check → question → research),
and questions can be saved with a personal note.

## 6. Data

Migration 5 (additive; existing data kept):

- `materials`: `index_version`, `language`, `extraction_quality`,
  `quality_score`, `warnings`.
- `material_chunks`: `page_end`, `section`, `quality`, `stems`, `spans`.
- The FTS5 table is rebuilt over the stemmed terms.
- `material_knowledge`: extracted items with page range, section, relation.
- `assistant_saved`: saved questions and notes per user.

Existing materials are re-indexed on start-up: text and Markdown files from
the stored file, PDF/DOCX from their existing passages (page numbers kept);
`npm run materials:reindex` re-reads PDF/DOCX files for full structure.

## 7. AI

- Optional. Without `ANTHROPIC_API_KEY` every task works; results say they
  were found by searching the material.
- With AI, only "Explain" asks the model, only with the retrieved passages,
  and the output is validated sentence by sentence.
- An AI failure falls back to the search result and says so.

## 8. As built

### Where the code is

| Part | Files |
| --- | --- |
| Word matching, synonyms | `src/lib/knowledge/language.ts`, `synonyms.ts` |
| Ingestion (clean, structure, passages) | `src/lib/knowledge/ingest.ts`; PDF lines and DOCX headings in `src/lib/files/extract.ts` |
| Knowledge extraction | `src/lib/knowledge/knowledge.ts` |
| Claim checking, understanding check | `src/lib/knowledge/grounding.ts` |
| Statement types and assumptions | `src/lib/knowledge/reasoning.ts` |
| Question suggestions | `src/lib/knowledge/questions.ts` |
| Writing the index, start-up upgrade | `src/lib/db/material-index.ts`, migration 5 in `src/lib/db/schema.ts` |
| Search (materials + lessons) | `src/lib/services/knowledge-search.ts` (also behind `searchPassages`) |
| Tasks, AI, research hand-off, saved questions | `src/lib/services/learning-assistant.ts` |
| API | `src/app/api/learning-assistant/` (task, research, saved) |
| Page and component | `src/app/learning-assistant/`, `src/components/assistant/learning-assistant.tsx` |
| Strings | `src/lib/i18n/assistant-en.ts`, `assistant-ka.ts`; terms in `terminology.ts` |
| Re-reading files | `scripts/reindex-materials.ts` (`npm run materials:reindex`) |

### Honesty rules, and where they are enforced

- **Only the material's text is shown as the material's.** Passages, key
  items and quotations are substrings of the stored text; the research
  hand-off looks the passages up again on the server rather than accepting
  quotations from the browser (`startResearch`).
- **No invented pages.** Pages come from the PDF's own page sequence; text
  and Word files keep `null` and are cited by section. A quotation note in a
  research project gets a page only when the passage has one.
- **Three levels of "found".** *Found*, *only part of the question found*
  (the best passages share less than half of its words) and *not found*,
  with the words the material does not contain listed. The AI is asked only
  on a full match.
- **Every AI sentence is labelled.** The model reports, per sentence,
  whether the passages state it, whether it is a conclusion from them, or
  whether it is uncertain, and which passages it rests on. `validateClaims`
  re-checks this with the same stemmer: a stated fact must share at least
  40 % of its content words (and two or more) with its passages, or with
  another passage (the citation is then corrected); every figure must occur
  in the passages; anything else is shown as *not found in the material*.
- **"Not found" is not "wrong".** The understanding check and the evidence
  task never judge a statement true or false; they say whether the material
  carries it, and suggest another source or the teacher.
- **Permissions.** Every query goes through the same visibility rule as the
  materials list (`material-access.ts`); a material named as scope must be
  visible to the person (otherwise 404); lessons are searched only when
  published, and only their section texts.

### Differences from the plan

- Relations between knowledge items are stored on the item (`relates_to`,
  `relation`) instead of in a separate table: each item has at most one.
- Lessons are indexed in memory (rebuilt when published lessons change)
  rather than in SQLite; there are about a hundred, and this keeps lesson
  edits and the index from drifting apart.
- A "partial match" state was added after the end-to-end tests showed that
  a question sharing one word with a lesson ("volcanic") was reported as
  found.
- Teachers can hand a research question or a list of suggested questions to
  students as an assignment (the assignment form takes a preset title and
  instructions).

### Tests

- `tests/unit/knowledge.test.ts` — stemming, synonyms, cleaning, structure,
  page attribution, knowledge extraction (English and Georgian), claim
  validation (paraphrase, citation repair, invented figure, inference,
  hedging), understanding check, statement types, formulas, questions, and a
  check that the prototype's name appears nowhere in `src/`.
- `tests/unit/learning-assistant.test.ts` — every task through the service,
  visibility and scope, typo tolerance, AI with a fake provider (labelling,
  failure fallback, no call when nothing is found), lessons without answers or
  solutions, research hand-off, saved questions, upgrade of old indexes.
- `tests/e2e/learning-assistant.spec.ts` — the page in Georgian and English,
  saving with a note, understanding check, evidence, questions, research
  project, teacher assignment hand-off, scope and permissions, honest
  not-found and partial states, touch on phone and tablet without sideways
  scrolling. The e2e server has no AI key, so these are also the AI-disabled
  acceptance tests.

### Limitations and next steps

- Search is lexical. A semantic re-ranker could be added inside
  `searchKnowledge` without changing its callers; it would need a local
  model to keep the platform free of paid services.
- No OCR: scanned PDFs are reported, not read.
- Knowledge extraction relies on explicit markers ("is called", „ეწოდება“,
  "for example", „მაგალითად“, "one might object"…). Textbooks that define
  terms without them yield passages but fewer key items.
- The synonym table is small and should grow with the school's subjects;
  teachers cannot yet add their own terms.
- The Georgian wording of the new screens has not yet been read by a native
  editor (see docs/AUDIT.md, section 8).
