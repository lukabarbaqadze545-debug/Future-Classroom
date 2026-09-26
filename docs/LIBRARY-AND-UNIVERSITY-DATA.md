# Library and university information: what is real, what is sample

Rule: the platform never presents invented facts as real. Anything a school
has not checked itself is either absent or clearly marked.

## What a new school gets

| Data | Real school (`SEED_DEMO` off) | Demo school (`SEED_DEMO=true`) |
| --- | --- | --- |
| Library catalogue | **Empty.** The librarian or teachers add the school's own resources. | 18 sample entries (below). |
| Physical copies, loans, QR labels | Empty | Sample shelves and loans |
| University cards | **None.** | 4 shared cards and 2 of a demo student's own cards |
| Careers and fields of study (`src/lib/labs/career/careers.ts`) | Built in | Built in |
| Built-in lessons | Built in | Built in |

Demo data exists only to show the platform. Do not use a demo database for
real students (`npm run doctor` reports staff accounts that still use the demo
password).

### The sample library entries (demo only)

| Entries | What they are | Status |
| --- | --- | --- |
| Newton's laws notes, quadratics notes, ecosystems notes (EN and KA) | Written for the demo as "school department notes" | Sample: stands for material a school would write itself. |
| OpenStax College Physics 2e, Biology 2e, Chemistry 2e, Introductory Statistics 2e | Real open textbooks, CC BY 4.0 | Real; the link goes to the publisher's own page. |
| Think Python 2e (Allen Downey, Green Tea Press) | Real, CC BY-NC 3.0 | Real; link to the author's page. |
| Competitive Programmer's Handbook (Antti Laaksonen, CSES) | Real, free to read online | Real; **link only** — the book is not copied. |
| Alice's Adventures in Wonderland, The Adventures of Sherlock Holmes, On the Origin of Species | Real, public domain | Real; links to Project Gutenberg. |
| ვეფხისტყაოსანი, A Brief History of Time, a Georgian–English dictionary | Real books | Listed as **physical copies only**; no text or scans. The shelf and loan records are sample. |

Nothing in the repository contains the text of a copyrighted book. Digital
copies are either written for the demo, public domain, openly licensed, or a
link to the rights holder's own page.

## Adding resources to a school library

Staff add resources on **Library → Add a resource**. Every resource has a
licence field; choose honestly:

| Licence | Use it when | What students get |
| --- | --- | --- |
| School-created | Teachers wrote it | The file |
| Public domain | The work is out of copyright (in Georgia: generally 70 years after the author's death) | The file or a link |
| CC BY / BY-SA / BY-NC / BY-NC-SA | The publisher states this licence | The file or a link; keep the attribution |
| Permission granted | The rights holder gave the school written permission | The file, only for this school; keep the permission letter |
| Link only | Free to read on the publisher's site, but no permission to copy | A link, no file |
| Physical copy only | Anything else (most textbooks and novels) | The catalogue entry and shelf location |

Do not upload scans or PDFs of commercial books, and do not copy text from
websites that do not allow it. When unsure, choose **link only** or **physical
copy only**.

A resource added by staff is, by definition, approved by the school: students
cannot add library resources. Staff can edit or remove any resource.

## University information

Admission rules, tuition, scholarships and deadlines change every year, so the
platform does not store them as facts:

- A university card separates **stable information** (name, city, programme,
  official website) from **time-sensitive information** (admission, tuition,
  scholarships, deadlines).
- Every card shows **when it was last checked** and against which source
  (the official page). Cards not checked, or checked more than a year ago, are
  marked in orange: "check the official website".
- The shared demo cards contain only each university's name, its official
  website and a note pointing students to the official pages and the Unified
  National Examinations; the time-sensitive fields are empty and the cards are
  marked "not checked".
- Students write their own cards as research notes. Nothing they write is shown
  to other students unless a teacher shares a card.

When someone checks a card against the official site, they press **I re-checked
it today**; the date is stored with the card.

## Not done (and why)

- No automatic import from university websites or the national assessment
  centre: that would copy content we have no permission to copy and would go
  stale silently.
- No list of "all Georgian universities": an incomplete or outdated list is
  worse than none. Schools add the universities their students actually ask
  about.
