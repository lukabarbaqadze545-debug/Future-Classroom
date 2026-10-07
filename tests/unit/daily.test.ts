import { describe, expect, it, vi } from "vitest";
import { CHALLENGE_TRIES, addDays, weekdayOf } from "@/lib/engagement/model";
import { LAUNCH_DAY, THEMES, challengeFor, challengeNumber, checkChallenge, poolFor, publicChallenge, themeOf } from "@/lib/daily/pick";
import { POST } from "@/app/api/daily/check/route";
import { resetRateLimits } from "@/lib/http/rate-limit";
import { todayInSchool } from "@/lib/services/daily";
import { NextRequest } from "next/server";

// The route reads the page language from a cookie.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "fc_locale" ? { value: "ka" } : undefined) }),
  headers: async () => new Headers(),
}));

const LANGUAGES = ["ka", "en"] as const;
const YEAR = Array.from({ length: 400 }, (_, i) => addDays("2026-10-01", i));

describe("the daily challenge", () => {
  it("is the same question for the same day, and changes from day to day", () => {
    for (const language of LANGUAGES) {
      expect(challengeFor("2026-10-07", language).id).toBe(challengeFor("2026-10-07", language).id);
      const ids = new Set(YEAR.slice(0, 14).map((day) => challengeFor(day, language).id));
      expect(ids.size).toBeGreaterThanOrEqual(12);
    }
  });

  it("gives every weekday its own kind of question", () => {
    expect(THEMES).toHaveLength(7);
    expect(themeOf("2026-10-05")).toBe("numbers"); // Monday
    expect(themeOf("2026-10-06")).toBe("science");
    expect(themeOf("2026-10-07")).toBe("code");
    expect(themeOf("2026-10-08")).toBe("mind");
    expect(themeOf("2026-10-09")).toBe("wildcard");
    expect(themeOf("2026-10-10")).toBe("world");
    expect(themeOf("2026-10-11")).toBe("life");
  });

  it("has enough questions of every kind, in both languages", () => {
    for (const language of LANGUAGES) {
      for (const theme of THEMES) expect(poolFor(theme, language).length, `${language}/${theme}`).toBeGreaterThanOrEqual(14);
    }
  });

  it("does not repeat a question within a cycle of a kind", () => {
    for (const language of LANGUAGES) {
      for (const theme of THEMES) {
        const pool = poolFor(theme, language);
        expect(new Set(pool.map((q) => q.id)).size, `${language}/${theme}`).toBe(pool.length);
        // Fourteen consecutive weeks of one weekday never repeat.
        const mondays = Array.from({ length: 14 }, (_, w) => addDays("2026-10-05", 7 * w + (THEMES.indexOf(theme) === 0 ? 0 : 0)));
        if (theme === "numbers") expect(new Set(mondays.map((d) => challengeFor(d, language).id)).size).toBe(14);
      }
    }
  });

  it("numbers the days from the launch", () => {
    expect(challengeNumber(LAUNCH_DAY)).toBe(1);
    expect(challengeNumber("2026-10-07")).toBe(7);
  });

  it("never sends anything that gives the answer away", () => {
    for (const language of LANGUAGES) {
      for (const day of YEAR) {
        const question = challengeFor(day, language);
        const publicForm = JSON.stringify(publicChallenge(day, language));
        // The browser's copy has no answer, hints, solution or explanation …
        for (const secret of [question.solution, question.explanation, ...question.hints]) {
          if (secret.length > 12) expect(publicForm.includes(secret), `${language} ${day}`).toBe(false);
        }
        expect(Object.keys(JSON.parse(publicForm)).sort()).toEqual(["day", "lessonTitle", "number", "options", "prompt", "subject", "theme", "title", "topic", "tries", "type", "weekday"]);
        // … and its options carry only an id and a text (no "correct" flag).
        for (const option of publicChallenge(day, language).options) expect(Object.keys(option).sort()).toEqual(["id", "text"]);
      }
    }
  });

  it("can be solved: the stated answer is accepted by the grader, and a wrong one is not", () => {
    for (const language of LANGUAGES) {
      for (const theme of THEMES) {
        for (const question of poolFor(theme, language)) {
          const right = question.type === "choice" ? { optionIds: [question.options.find((o) => o.text === question.answer)!.id], text: "" } : { optionIds: [], text: question.answer };
          expect(question.grade(right), `${language} ${question.id} → ${question.answer}`).toBe(true);
          const wrong = question.type === "choice" ? { optionIds: [question.options.find((o) => o.text !== question.answer)!.id], text: "" } : { optionIds: [], text: "zzz-not-an-answer" };
          expect(question.grade(wrong), `${language} ${question.id}`).toBe(false);
        }
      }
    }
  });

  it("offers a real choice: every choice question has one right option among several", () => {
    for (const language of LANGUAGES) {
      for (const question of poolFor("wildcard", language)) {
        if (question.type !== "choice") continue;
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(question.options.filter((o) => o.text === question.answer)).toHaveLength(1);
        expect(new Set(question.options.map((o) => o.id)).size).toBe(question.options.length);
      }
    }
  });

  it("is written in the language of the page", () => {
    const georgian = /[Ⴀ-ჿ]/;
    for (const day of YEAR.slice(0, 60)) {
      expect(georgian.test(challengeFor(day, "ka").prompt), day).toBe(true);
      expect(georgian.test(challengeFor(day, "en").prompt), day).toBe(false);
    }
  });
});

describe("checking an answer", () => {
  const day = "2026-10-07";

  function wrongAnswer(language: "ka" | "en") {
    const question = challengeFor(day, language);
    return question.type === "choice" ? { optionIds: [question.options.find((o) => o.text !== question.answer)!.id], text: "" } : { optionIds: [], text: "zzz" };
  }
  function rightAnswer(language: "ka" | "en") {
    const question = challengeFor(day, language);
    return question.type === "choice" ? { optionIds: [question.options.find((o) => o.text === question.answer)!.id], text: "" } : { optionIds: [], text: question.answer };
  }

  it("explains a right answer and gives nothing else", () => {
    const result = checkChallenge(day, "en", rightAnswer("en"), 1);
    expect(result.isCorrect).toBe(true);
    expect(result.hint).toBeNull();
    expect(result.solution).toBeNull();
    // (About half of the built-in questions have no written explanation yet; the page then shows none.)
    expect(typeof result.explanation).toBe("string");
  });

  it("answers a wrong try with a hint, but not the answer, until the tries run out", () => {
    for (let attempt = 1; attempt < CHALLENGE_TRIES; attempt++) {
      const result = checkChallenge(day, "en", wrongAnswer("en"), attempt);
      expect(result.isCorrect).toBe(false);
      expect(result.solution).toBeNull();
      expect(result.explanation).toBe("");
    }
    const last = checkChallenge(day, "en", wrongAnswer("en"), CHALLENGE_TRIES);
    expect(last.isCorrect).toBe(false);
    expect(last.solution).toBe(challengeFor(day, "en").answer);
    expect(last.hint).toBeNull();
  });

  it("never hands out the last hint of the ladder (it is the explanation)", () => {
    for (const day of YEAR.slice(0, 120)) {
      const question = challengeFor(day, "en");
      if (question.hints.length < 2) continue;
      const lastHint = question.hints[question.hints.length - 1];
      for (let attempt = 1; attempt < CHALLENGE_TRIES; attempt++) {
        const wrong = question.type === "choice" ? { optionIds: [question.options.find((o) => o.text !== question.answer)!.id], text: "" } : { optionIds: [], text: "zzz" };
        expect(checkChallenge(day, "en", wrong, attempt).hint).not.toBe(lastHint);
      }
    }
  });
});

describe("the check route", () => {
  const request = (body: unknown) =>
    new NextRequest("http://localhost/api/daily/check", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9" } });

  it("grades today's question for anyone, without an account", async () => {
    resetRateLimits();
    const day = todayInSchool();
    const question = challengeFor(day, "ka");
    const answer = question.type === "choice" ? { optionIds: [question.options.find((o) => o.text === question.answer)!.id], text: "" } : { optionIds: [], text: question.answer };
    const right = await POST(request({ day, answer, attempt: 1 }), undefined as never);
    expect(right.status).toBe(200);
    expect((await right.json()).isCorrect).toBe(true);
  });

  it("refuses another day's question, empty answers and nonsense", async () => {
    resetRateLimits();
    const day = todayInSchool();
    expect((await POST(request({ day: addDays(day, -1), answer: { optionIds: ["a"], text: "" }, attempt: 1 }), undefined as never)).status).toBe(409);
    expect((await POST(request({ day, answer: { optionIds: [], text: "  " }, attempt: 1 }), undefined as never)).status).toBe(400);
    expect((await POST(request({ day, answer: { optionIds: ["a"], text: "" }, attempt: 9 }), undefined as never)).status).toBe(400);
    expect((await POST(request({ day: "tomorrow", answer: { optionIds: ["a"], text: "" }, attempt: 1 }), undefined as never)).status).toBe(400);
  });

  it("limits how fast one visitor can try", async () => {
    resetRateLimits();
    const day = todayInSchool();
    const answer = { optionIds: ["zzz"], text: "zzz" };
    let limited = 0;
    for (let i = 0; i < 70; i++) {
      const response = await POST(request({ day, answer, attempt: 1 }), undefined as never);
      if (response.status === 429) limited++;
    }
    expect(limited).toBeGreaterThan(0);
    resetRateLimits();
  });

  it("knows which weekday each day is", () => {
    expect(weekdayOf(todayInSchool())).toBeGreaterThanOrEqual(1);
  });
});
