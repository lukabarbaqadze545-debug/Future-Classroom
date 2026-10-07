import { describe, expect, it } from "vitest";
import {
  BADGES,
  CHALLENGE_TRIES,
  QUESTS,
  XP,
  addDays,
  applyEvent,
  dayKey,
  daysBetween,
  emptyState,
  hourIn,
  levelOf,
  levelProgress,
  parseState,
  questProgress,
  secondsToNextDay,
  streakOf,
  weekView,
  weekdayOf,
  withName,
  xpForLevel,
  type EngagementEvent,
  type EngagementState,
} from "@/lib/engagement/model";

const TZ = "Asia/Tbilisi";
const at = (today: string, hour = 15) => ({ today, hour });

function play(events: [EngagementEvent, string, number?][], from: EngagementState = emptyState("2026-10-01")) {
  let state = from;
  const deltas = [];
  for (const [event, day, hour] of events) {
    const result = applyEvent(state, event, at(day, hour));
    state = result.state;
    deltas.push(result.delta);
  }
  return { state, deltas };
}

describe("school days", () => {
  it("names the day in the school's time zone, not the server's", () => {
    // 21:30 UTC on 1 October is already 2 October in Tbilisi (UTC+4).
    const moment = new Date("2026-10-01T21:30:00Z");
    expect(dayKey(moment, TZ)).toBe("2026-10-02");
    expect(dayKey(moment, "UTC")).toBe("2026-10-01");
    expect(hourIn(moment, TZ)).toBe(1);
    expect(hourIn(new Date("2026-10-01T20:00:00Z"), TZ)).toBe(0);
  });

  it("falls back to UTC for an unknown time zone instead of failing", () => {
    expect(dayKey(new Date("2026-10-01T12:00:00Z"), "Not/AZone")).toBe("2026-10-01");
  });

  it("does day arithmetic across months and years", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(daysBetween("2026-10-01", "2026-10-08")).toBe(7);
    expect(weekdayOf("2026-10-05")).toBe(1); // Monday
    expect(weekdayOf("2026-10-11")).toBe(7); // Sunday
  });

  it("counts the seconds to the next school day", () => {
    // 23:59:50 in Tbilisi (19:59:50 UTC).
    expect(secondsToNextDay(new Date("2026-10-01T19:59:50Z"), TZ)).toBe(10);
    // Just after midnight there is nearly a whole day left.
    expect(secondsToNextDay(new Date("2026-10-01T20:00:01Z"), TZ)).toBe(24 * 3600 - 1);
  });
});

describe("streak", () => {
  it("counts consecutive days and stays alive until the end of the next day", () => {
    const days = ["2026-10-01", "2026-10-02", "2026-10-03"];
    expect(streakOf(days, "2026-10-03")).toEqual({ streak: 3, doneToday: true });
    // Nothing yet today: the streak is still alive, waiting for today.
    expect(streakOf(days, "2026-10-04")).toEqual({ streak: 3, doneToday: false });
    // A whole day missed: gone.
    expect(streakOf(days, "2026-10-05")).toEqual({ streak: 0, doneToday: false });
    expect(streakOf([], "2026-10-05")).toEqual({ streak: 0, doneToday: false });
  });

  it("is broken by a gap", () => {
    expect(streakOf(["2026-10-01", "2026-10-03"], "2026-10-03").streak).toBe(1);
  });

  it("shows the week from Monday to Sunday", () => {
    const week = weekView(["2026-10-05", "2026-10-07"], "2026-10-07");
    expect(week.map((d) => d.day)).toEqual(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"]);
    expect(week.map((d) => d.done)).toEqual([true, false, true, false, false, false, false]);
    expect(week.filter((d) => d.isToday).map((d) => d.day)).toEqual(["2026-10-07"]);
    expect(week.filter((d) => d.future)).toHaveLength(4);
  });
});

describe("levels", () => {
  it("needs more experience for each level", () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000]);
    expect(levelOf(0)).toBe(1);
    expect(levelOf(99)).toBe(1);
    expect(levelOf(100)).toBe(2);
    expect(levelOf(999)).toBe(4);
    expect(levelOf(1000)).toBe(5);
    expect(levelProgress(150)).toEqual({ level: 2, into: 50, needed: 200, fraction: 0.25 });
  });
});

describe("events", () => {
  it("rewards a first-try challenge and starts the streak", () => {
    const { state, deltas } = play([[{ kind: "challenge", outcome: "solved", attempts: 1 }, "2026-10-01"]]);
    // 20 + 10 first try + 1 day of streak × 2.
    expect(deltas[0].xp).toBe(XP.challengeSolved + XP.firstTryBonus + XP.streakBonusPerDay);
    expect(deltas[0].streak).toBe(1);
    expect(deltas[0].streakGrew).toBe(true);
    expect(state.today.challenge).toBe("solved");
    expect(state.totals.firstTry).toBe(1);
    expect(state.solved).toEqual(["2026-10-01"]);
    expect(deltas[0].newBadges).toEqual(expect.arrayContaining(["firstStep", "challenge1", "firstTry"]));
  });

  it("gives less for a challenge solved on a later try and a little for a missed one", () => {
    const solved = play([[{ kind: "challenge", outcome: "solved", attempts: 3 }, "2026-10-01"]]);
    expect(solved.deltas[0].xp).toBe(XP.challengeSolved + XP.streakBonusPerDay);
    expect(solved.state.badges.firstTry).toBeUndefined();
    const missed = play([[{ kind: "challenge", outcome: "missed", attempts: CHALLENGE_TRIES }, "2026-10-01"]]);
    expect(missed.deltas[0].xp).toBe(XP.challengeMissed);
    // Showing up keeps the streak even when the answer was not found.
    expect(missed.deltas[0].streak).toBe(1);
    expect(missed.state.totals.challenges).toBe(0);
  });

  it("counts the challenge once a day", () => {
    const { state, deltas } = play([
      [{ kind: "challenge", outcome: "solved", attempts: 1 }, "2026-10-01"],
      [{ kind: "challenge", outcome: "solved", attempts: 1 }, "2026-10-01"],
    ]);
    expect(deltas[1].xp).toBe(0);
    expect(state.totals.challenges).toBe(1);
  });

  it("remembers wrong tries without giving experience or a streak day", () => {
    const { state, deltas } = play([[{ kind: "attempt", attempts: 2 }, "2026-10-01"]]);
    expect(state.today.attempts).toBe(2);
    expect(deltas[0].xp).toBe(0);
    expect(state.days).toEqual([]);
  });

  it("builds the streak over days and adds a bonus that stops growing", () => {
    const events: [EngagementEvent, string][] = Array.from({ length: 10 }, (_, i) => [{ kind: "challenge", outcome: "solved", attempts: 1 }, addDays("2026-10-01", i)]);
    const { state, deltas } = play(events);
    expect(state.best).toBe(10);
    expect(deltas.map((d) => d.streak)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(deltas[6].xp).toBe(deltas[9].xp - 0 /* capped bonus: day 7 and day 10 pay the same */);
    expect(state.badges.streak3).toBe("2026-10-03");
    expect(state.badges.streak7).toBe("2026-10-07");
    expect(state.badges.streak30).toBeUndefined();
  });

  it("restarts the streak after a missed day but keeps the best one", () => {
    const { state, deltas } = play([
      [{ kind: "practice" }, "2026-10-01"],
      [{ kind: "practice" }, "2026-10-02"],
      [{ kind: "practice" }, "2026-10-03"],
      [{ kind: "practice" }, "2026-10-05"],
    ]);
    expect(deltas[3].streak).toBe(1);
    expect(state.best).toBe(3);
  });

  it("resets the daily counters on a new day", () => {
    const { state } = play([
      [{ kind: "challenge", outcome: "solved", attempts: 1 }, "2026-10-01"],
      [{ kind: "practice" }, "2026-10-02"],
    ]);
    expect(state.today.day).toBe("2026-10-02");
    expect(state.today.challenge).toBe("open");
    expect(state.today.practice).toBe(1);
  });

  it("caps the experience from practice per day", () => {
    const events: [EngagementEvent, string][] = Array.from({ length: 20 }, () => [{ kind: "practice" }, "2026-10-01"]);
    const { state } = play(events);
    expect(state.totals.practice).toBe(20);
    expect(state.xp).toBe(XP.practiceDailyCap);
  });

  it("scores a quiz by its result and notices a perfect one", () => {
    const half = play([[{ kind: "quiz", score: 2, max: 4 }, "2026-10-01"]]);
    expect(half.deltas[0].xp).toBe(XP.quizBase + XP.quizScore / 2);
    expect(half.state.badges.quizAce).toBeUndefined();
    const perfect = play([[{ kind: "quiz", score: 4, max: 4 }, "2026-10-01"]]);
    expect(perfect.deltas[0].xp).toBe(XP.quizBase + XP.quizScore);
    expect(perfect.state.badges.quizAce).toBe("2026-10-01");
    // A broken quiz result never produces negative or huge experience.
    expect(play([[{ kind: "quiz", score: 9, max: 0 }, "2026-10-01"]]).deltas[0].xp).toBe(XP.quizBase);
    expect(play([[{ kind: "quiz", score: 99, max: 4 }, "2026-10-01"]]).deltas[0].xp).toBe(XP.quizBase + XP.quizScore);
  });

  it("pays for a laboratory once a day and earns the explorer badge with three", () => {
    const { state, deltas } = play([
      [{ kind: "lab", lab: "stem" }, "2026-10-01"],
      [{ kind: "lab", lab: "stem" }, "2026-10-01"],
      [{ kind: "lab", lab: "programming" }, "2026-10-01"],
      [{ kind: "lab", lab: "research" }, "2026-10-01"],
    ]);
    expect(deltas.map((d) => d.xp)).toEqual([XP.lab, 0, XP.lab, XP.lab]);
    expect(state.badges.explorer).toBe("2026-10-01");
  });

  it("gives joining a live class once a day", () => {
    const { deltas, state } = play([
      [{ kind: "join" }, "2026-10-01"],
      [{ kind: "join" }, "2026-10-01"],
    ]);
    expect(deltas.map((d) => d.xp)).toEqual([XP.join, 0]);
    expect(state.badges.liveClass).toBe("2026-10-01");
  });

  it("opens the daily chest when the three quests are done, once", () => {
    const { state, deltas } = play([
      [{ kind: "practice" }, "2026-10-01"],
      [{ kind: "practice" }, "2026-10-01"],
      [{ kind: "live" }, "2026-10-01"],
      [{ kind: "lab", lab: "stem" }, "2026-10-01"],
      [{ kind: "challenge", outcome: "solved", attempts: 1 }, "2026-10-01"],
      [{ kind: "practice" }, "2026-10-01"],
    ]);
    expect(deltas.map((d) => d.chest)).toEqual([false, false, false, false, true, false]);
    const progress = questProgress(state);
    for (const id of QUESTS) expect(progress[id].done).toBe(progress[id].target);
    expect(state.today.chest).toBe(true);
  });

  it("reports a level-up and the badge for level 5", () => {
    const rich = { ...emptyState("2026-10-01"), xp: 995 };
    const { state, deltas } = play([[{ kind: "practice" }, "2026-10-01"]], rich);
    expect(deltas[0].levelUp).toBe(5);
    expect(state.badges.level5).toBe("2026-10-01");
    expect(play([[{ kind: "practice" }, "2026-10-01"]]).deltas[0].levelUp).toBeNull();
  });

  it("notices late-night and early-morning solvers", () => {
    expect(play([[{ kind: "challenge", outcome: "solved", attempts: 1 }, "2026-10-01", 23]]).state.badges.nightOwl).toBeDefined();
    expect(play([[{ kind: "challenge", outcome: "solved", attempts: 1 }, "2026-10-01", 2]]).state.badges.nightOwl).toBeDefined();
    expect(play([[{ kind: "challenge", outcome: "solved", attempts: 1 }, "2026-10-01", 5]]).state.badges.earlyBird).toBeDefined();
    expect(play([[{ kind: "challenge", outcome: "solved", attempts: 1 }, "2026-10-01", 15]]).state.badges.nightOwl).toBeUndefined();
  });

  it("never earns the same badge twice", () => {
    const first = play([[{ kind: "practice" }, "2026-10-01"]]);
    const second = applyEvent(first.state, { kind: "practice" }, at("2026-10-02"));
    expect(second.delta.newBadges).toEqual([]);
    expect(second.state.badges.firstStep).toBe("2026-10-01");
  });

  it("has a rule for every badge id once", () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("what is stored in the browser", () => {
  it("survives a round trip", () => {
    const { state } = play([
      [{ kind: "challenge", outcome: "solved", attempts: 2 }, "2026-10-01", 23],
      [{ kind: "lab", lab: "stem" }, "2026-10-01"],
    ]);
    const named = withName(state, "  Luka  ");
    expect(parseState(JSON.stringify(named), "2026-10-01")).toEqual(named);
  });

  it("starts fresh from nothing, rubbish or another version", () => {
    const fresh = emptyState("2026-10-07");
    expect(parseState(null, "2026-10-07")).toEqual(fresh);
    expect(parseState("not json", "2026-10-07")).toEqual(fresh);
    expect(parseState("[1,2]", "2026-10-07")).toEqual(fresh);
    expect(parseState(JSON.stringify({ v: 99, xp: 5000 }), "2026-10-07")).toEqual(fresh);
  });

  it("repairs a damaged record instead of trusting it", () => {
    const parsed = parseState(
      JSON.stringify({ v: 1, name: "<b>Ana</b>", xp: -5, days: ["2026-10-02", "nope", 4, "2026-10-01"], best: "9", badges: { firstStep: "2026-10-01", madeUp: "2026-10-01", level5: "yesterday" }, totals: { challenges: 2.7 }, today: { day: "2026-10-01", challenge: "won", attempts: 99 } }),
      "2026-10-07",
    );
    expect(parsed.name).toBe("bAna/b");
    expect(parsed.xp).toBe(0);
    expect(parsed.days).toEqual(["2026-10-01", "2026-10-02"]);
    expect(parsed.best).toBe(0);
    expect(parsed.badges).toEqual({ firstStep: "2026-10-01" });
    expect(parsed.totals.challenges).toBe(2);
    // The stored day is old: the day's counters start over.
    expect(parsed.today).toEqual(emptyState("2026-10-07").today);
  });

  it("limits the name", () => {
    expect(withName(emptyState("2026-10-07"), "x".repeat(100)).name).toHaveLength(24);
    expect(withName(emptyState("2026-10-07"), "a\u0000b\n  c").name).toBe("ab c");
  });
});

describe("how the game reaches the screen", () => {
  it("never puts its state in a React context", async () => {
    // A context value that changes just after the page loads makes React discard the server HTML of every
    // part of the page still streaming in and render it again in the browser (seen as duplicated form fields).
    const { readdirSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const dir = join(process.cwd(), "src", "components", "engagement");
    for (const file of readdirSync(dir)) {
      expect(readFileSync(join(dir, file), "utf-8"), file).not.toMatch(/createContext|useContext/);
    }
  });
});
