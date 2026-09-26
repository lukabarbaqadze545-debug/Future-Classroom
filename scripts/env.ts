/**
 * Loads the same .env files the server reads (first one wins, and variables
 * already set in the shell win over all of them), so maintenance scripts act
 * on the same database and upload folder as the running server.
 */
import fs from "node:fs";

for (const file of [".env.production.local", ".env.local", ".env.production", ".env"]) {
  if (fs.existsSync(file)) process.loadEnvFile(file);
}
