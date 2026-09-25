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
];
