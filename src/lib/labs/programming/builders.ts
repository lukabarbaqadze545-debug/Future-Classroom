import type { L } from "../localized";
import type { ChoiceProblem, CodeProblem, PredictProblem, ProgLanguage, TestCase } from "./types";

/** Tiny helpers so the curriculum files read like a list of problems. */

export const CPP_STARTER = `#include <iostream>
using namespace std;

int main() {
    // Write your solution here

    return 0;
}
`;

export const CPP_STARTER_CONTEST = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // Write your solution here

    return 0;
}
`;

export function t(input: string, output: string, sample = false): TestCase {
  return { input, output, sample };
}

export function code(p: Omit<CodeProblem, "kind" | "timeLimitMs" | "starter"> & { timeLimitMs?: number; starter?: Partial<Record<ProgLanguage, string>> }): CodeProblem {
  return {
    ...p,
    kind: "code",
    timeLimitMs: p.timeLimitMs ?? 2000,
    starter: {
      python: p.starter?.python ?? "# Write your solution here\n",
      cpp: p.starter?.cpp ?? (p.level === 4 ? CPP_STARTER_CONTEST : CPP_STARTER),
    },
  };
}

export function predict(p: Omit<PredictProblem, "kind">): PredictProblem {
  return { ...p, kind: "predict" };
}

export function choice(p: Omit<ChoiceProblem, "kind" | "options"> & { options: [string, L][] }): ChoiceProblem {
  return { ...p, kind: "choice", options: p.options.map(([id, text]) => ({ id, text })) };
}
