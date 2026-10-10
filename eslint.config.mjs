import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The Pyodide runtime copied from node_modules before a build (scripts/copy-pyodide.mjs).
    "public/pyodide/**",
  ]),
  {
    // The C++ interpreter runs a dynamically typed language: its run-time values (numbers, BigInts, strings,
    // objects, places) are `any` on purpose, and the compiler checks types before anything runs.
    files: ["src/lib/cpp/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-this-alias": "off",
    },
  },
]);

export default eslintConfig;
