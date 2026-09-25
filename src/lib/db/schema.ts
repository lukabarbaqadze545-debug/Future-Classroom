/**
 * Database schema, applied as ordered migrations. Add new migrations to the
 * end of the list; never edit one that has shipped.
 *
 * Design notes
 * - Lesson and quiz content is stored as validated JSON documents: teachers
 *   edit them as a whole and they are always read as a whole.
 * - A classroom session snapshots each activity when it is created, so
 *   editing a lesson later never rewrites the history of a past session.
 * - Students are identified by a display name only. Guests who join with a
 *   code have no account; their answers are tied to the session.
 * - `material_chunks` + FTS5 is the retrieval layer for school materials. The
 *   `embedding` column is reserved for a future semantic-search index.
 */
export const MIGRATIONS: { id: number; name: string; sql: string }[] = [
  {
    id: 1,
    name: "initial",
    sql: `
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  role          TEXT NOT NULL CHECK (role IN ('student','teacher','admin')),
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name  TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

CREATE TABLE auth_sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX auth_sessions_user ON auth_sessions(user_id);

CREATE TABLE lessons (
  id           TEXT PRIMARY KEY,
  teacher_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  subject      TEXT NOT NULL,
  grade        INTEGER NOT NULL,
  topic        TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  objective    TEXT NOT NULL DEFAULT '',
  difficulty   TEXT NOT NULL,
  language     TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('draft','published')),
  origin       TEXT NOT NULL CHECK (origin IN ('ai','template','manual')),
  ai_model     TEXT,
  content      TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX lessons_teacher ON lessons(teacher_id, updated_at DESC);
CREATE INDEX lessons_published ON lessons(status, subject);

CREATE TABLE quizzes (
  id            TEXT PRIMARY KEY,
  teacher_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id     TEXT REFERENCES lessons(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  subject       TEXT NOT NULL,
  grade         INTEGER NOT NULL,
  topic         TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL CHECK (status IN ('draft','published')),
  origin        TEXT NOT NULL CHECK (origin IN ('ai','template','manual')),
  feedback_mode TEXT NOT NULL CHECK (feedback_mode IN ('full','score_only')),
  questions     TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX quizzes_teacher ON quizzes(teacher_id, updated_at DESC);

CREATE TABLE quiz_attempts (
  id           TEXT PRIMARY KEY,
  quiz_id      TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers      TEXT NOT NULL,
  results      TEXT NOT NULL,
  score        INTEGER NOT NULL,
  max_score    INTEGER NOT NULL,
  submitted_at INTEGER NOT NULL
);
CREATE INDEX quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX quiz_attempts_student ON quiz_attempts(student_id, submitted_at DESC);

CREATE TABLE classroom_sessions (
  id                  TEXT PRIMARY KEY,
  teacher_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id           TEXT REFERENCES lessons(id) ON DELETE SET NULL,
  join_code           TEXT NOT NULL,
  title               TEXT NOT NULL,
  subject             TEXT NOT NULL,
  grade               INTEGER NOT NULL,
  class_label         TEXT NOT NULL DEFAULT '',
  status              TEXT NOT NULL CHECK (status IN ('lobby','live','ended')),
  paused              INTEGER NOT NULL DEFAULT 0,
  current_activity_id TEXT,
  version             INTEGER NOT NULL DEFAULT 1,
  created_at          INTEGER NOT NULL,
  started_at          INTEGER,
  ended_at            INTEGER
);
CREATE INDEX sessions_teacher ON classroom_sessions(teacher_id, created_at DESC);
CREATE UNIQUE INDEX sessions_active_code ON classroom_sessions(join_code) WHERE status != 'ended';

CREATE TABLE session_activities (
  id            TEXT PRIMARY KEY,
  session_id    TEXT NOT NULL REFERENCES classroom_sessions(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  data          TEXT NOT NULL,
  state         TEXT NOT NULL CHECK (state IN ('pending','open','closed')),
  revealed      INTEGER NOT NULL DEFAULT 0,
  launched_at   INTEGER,
  closed_at     INTEGER,
  timer_ends_at INTEGER
);
CREATE INDEX session_activities_session ON session_activities(session_id, position);

CREATE TABLE session_participants (
  id           TEXT PRIMARY KEY,
  session_id   TEXT NOT NULL REFERENCES classroom_sessions(id) ON DELETE CASCADE,
  user_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  token_hash   TEXT NOT NULL UNIQUE,
  joined_at    INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);
CREATE INDEX participants_session ON session_participants(session_id);

CREATE TABLE activity_progress (
  session_activity_id TEXT NOT NULL REFERENCES session_activities(id) ON DELETE CASCADE,
  participant_id      TEXT NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,
  hints_used          INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (session_activity_id, participant_id)
);

CREATE TABLE responses (
  id                  TEXT PRIMARY KEY,
  session_activity_id TEXT NOT NULL REFERENCES session_activities(id) ON DELETE CASCADE,
  participant_id      TEXT NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,
  answer              TEXT NOT NULL,
  is_correct          INTEGER,
  attempts            INTEGER NOT NULL DEFAULT 1,
  hints_used          INTEGER NOT NULL DEFAULT 0,
  submitted_at        INTEGER NOT NULL,
  UNIQUE (session_activity_id, participant_id)
);

CREATE TABLE materials (
  id           TEXT PRIMARY KEY,
  owner_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  subject      TEXT NOT NULL,
  grade        INTEGER,
  author       TEXT NOT NULL DEFAULT '',
  tags         TEXT NOT NULL DEFAULT '[]',
  visibility   TEXT NOT NULL CHECK (visibility IN ('private','teachers','students')),
  file_name    TEXT NOT NULL,
  stored_name  TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  size_bytes   INTEGER NOT NULL,
  text_status  TEXT NOT NULL CHECK (text_status IN ('indexed','no_text','failed')),
  page_count   INTEGER,
  created_at   INTEGER NOT NULL
);
CREATE INDEX materials_owner ON materials(owner_id, created_at DESC);

CREATE TABLE material_chunks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  page        INTEGER,
  content     TEXT NOT NULL,
  embedding   BLOB
);
CREATE INDEX material_chunks_material ON material_chunks(material_id, position);

CREATE VIRTUAL TABLE material_chunks_fts USING fts5(
  content,
  content='material_chunks',
  content_rowid='id',
  tokenize='unicode61 remove_diacritics 2'
);
CREATE TRIGGER material_chunks_ai AFTER INSERT ON material_chunks BEGIN
  INSERT INTO material_chunks_fts(rowid, content) VALUES (new.id, new.content);
END;
CREATE TRIGGER material_chunks_ad AFTER DELETE ON material_chunks BEGIN
  INSERT INTO material_chunks_fts(material_chunks_fts, rowid, content) VALUES ('delete', old.id, old.content);
END;

CREATE TABLE lesson_materials (
  lesson_id   TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  PRIMARY KEY (lesson_id, material_id)
);

-- AI-generated hints are cached per activity and level so a whole class
-- asking at once costs one model call and every student sees the same hint.
CREATE TABLE hint_cache (
  cache_key  TEXT PRIMARY KEY,
  text       TEXT NOT NULL,
  model      TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE learning_events (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('practice','session','quiz','lesson_view')),
  subject    TEXT NOT NULL,
  topic      TEXT NOT NULL,
  lesson_id  TEXT,
  ref_id     TEXT,
  correct    INTEGER,
  detail     TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);
CREATE INDEX learning_events_user ON learning_events(user_id, created_at DESC);
`,
  },
  {
    id: 2,
    name: "laboratories",
    sql: `
-- Classes: a teacher's group of student accounts (e.g. "11A").
CREATE TABLE classes (
  id         TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE class_members (
  class_id   TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, student_id)
);
CREATE INDEX class_members_student ON class_members(student_id);

-- Assignments point at an item in any laboratory (kind + ref_id) or are a
-- custom task. Recipients are expanded when the assignment is created.
CREATE TABLE assignments (
  id           TEXT PRIMARY KEY,
  teacher_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,
  ref_id       TEXT,
  title        TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  due_at       INTEGER,
  class_id     TEXT REFERENCES classes(id) ON DELETE SET NULL,
  archived     INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL
);
CREATE INDEX assignments_teacher ON assignments(teacher_id, created_at DESC);
CREATE TABLE assignment_recipients (
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL CHECK (status IN ('assigned','in_progress','submitted','completed','reviewed','revision')),
  work_ref      TEXT,
  score         INTEGER,
  max_score     INTEGER,
  response      TEXT NOT NULL DEFAULT '{}',
  submitted_at  INTEGER,
  feedback      TEXT NOT NULL DEFAULT '',
  feedback_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
  feedback_at   INTEGER,
  updated_at    INTEGER NOT NULL,
  PRIMARY KEY (assignment_id, student_id)
);
CREATE INDEX assignment_recipients_student ON assignment_recipients(student_id, status);

CREATE TABLE bookmarks (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,
  ref_id     TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, kind, ref_id)
);

-- Teacher feedback on any piece of student work (research, projects, …).
CREATE TABLE feedback (
  id          TEXT PRIMARY KEY,
  target_kind TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  author_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX feedback_target ON feedback(target_kind, target_id, created_at);

-- Files students attach to projects and portfolio items.
CREATE TABLE attachments (
  id          TEXT PRIMARY KEY,
  owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_kind TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type   TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX attachments_target ON attachments(target_kind, target_id);

-- Programming laboratory. Built-in problems live in code; teachers can add
-- their own (same JSON shape). Submissions record how they were checked.
CREATE TABLE programming_problems (
  id         TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data       TEXT NOT NULL,
  published  INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE programming_submissions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  language   TEXT NOT NULL,
  code       TEXT NOT NULL DEFAULT '',
  answer     TEXT NOT NULL DEFAULT '',
  verdict    TEXT NOT NULL,
  passed     INTEGER NOT NULL DEFAULT 0,
  total      INTEGER NOT NULL DEFAULT 0,
  checker    TEXT NOT NULL,
  details    TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL
);
CREATE INDEX programming_submissions_user ON programming_submissions(user_id, problem_id, created_at DESC);

-- STEM laboratory: a student's record for an experiment / simulation /
-- electronics or robotics challenge, and engineering projects.
CREATE TABLE stem_records (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_kind  TEXT NOT NULL,
  item_id    TEXT NOT NULL,
  data       TEXT NOT NULL DEFAULT '{}',
  status     TEXT NOT NULL CHECK (status IN ('draft','submitted')),
  score      INTEGER,
  max_score  INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (user_id, item_kind, item_id)
);
CREATE TABLE stem_projects (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id TEXT,
  kind        TEXT NOT NULL,
  title       TEXT NOT NULL,
  data        TEXT NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL CHECK (status IN ('draft','submitted')),
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX stem_projects_user ON stem_projects(user_id, updated_at DESC);

-- Research laboratory.
CREATE TABLE research_projects (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  data       TEXT NOT NULL DEFAULT '{}',
  status     TEXT NOT NULL CHECK (status IN ('draft','submitted')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX research_projects_user ON research_projects(user_id, updated_at DESC);
CREATE TABLE research_sources (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  data       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE research_notes (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  source_id  TEXT REFERENCES research_sources(id) ON DELETE SET NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('note','quote','evidence')),
  content    TEXT NOT NULL,
  page       TEXT NOT NULL DEFAULT '',
  stance     TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE research_datasets (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  data       TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Critical thinking laboratory attempts (scored deterministically).
CREATE TABLE ct_attempts (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  kind        TEXT NOT NULL,
  answers     TEXT NOT NULL,
  result      TEXT NOT NULL,
  score       INTEGER NOT NULL,
  max_score   INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX ct_attempts_user ON ct_attempts(user_id, created_at DESC);

-- School library: catalogue, physical copies (each with its own QR code),
-- reading progress and links to lessons.
CREATE TABLE library_resources (
  id           TEXT PRIMARY KEY,
  data         TEXT NOT NULL,
  material_id  TEXT REFERENCES materials(id) ON DELETE SET NULL,
  created_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE TABLE library_copies (
  id          TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE,
  shelf       TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL CHECK (status IN ('available','on_loan','reference','missing')),
  borrower_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  due_at      INTEGER,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX library_copies_resource ON library_copies(resource_id);
CREATE TABLE reading_progress (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
  status      TEXT NOT NULL CHECK (status IN ('want','reading','finished')),
  percent     INTEGER NOT NULL DEFAULT 0,
  note        TEXT NOT NULL DEFAULT '',
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, resource_id)
);
CREATE TABLE lesson_resources (
  lesson_id   TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
  PRIMARY KEY (lesson_id, resource_id)
);

-- Career & university laboratory.
CREATE TABLE university_cards (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared     INTEGER NOT NULL DEFAULT 0,
  data       TEXT NOT NULL,
  checked_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX university_cards_owner ON university_cards(owner_id);
CREATE TABLE portfolio_items (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  data        TEXT NOT NULL,
  item_date   TEXT NOT NULL,
  source_kind TEXT,
  source_id   TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX portfolio_items_user ON portfolio_items(user_id, item_date DESC);
CREATE TABLE development_goals (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data       TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('active','done')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE skill_ratings (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id   TEXT NOT NULL,
  level      INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, skill_id)
);
`,
  },
];
