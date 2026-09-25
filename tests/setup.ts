import os from "node:os";
import path from "node:path";
import fs from "node:fs";

// Unit tests never touch the real database, uploads or an AI service.
process.env.DATABASE_PATH = ":memory:";
process.env.SEED_DEMO = "false";
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "fc-test-uploads-"));
delete process.env.ANTHROPIC_API_KEY;
