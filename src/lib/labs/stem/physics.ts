/*
 * Pure models shared by the simulations (in the browser) and the answer
 * checkers (on the server), so what students see and what is graded agree.
 * SI units throughout.
 */

export const GRAVITY = { earth: 9.81, moon: 1.62, mars: 3.71 } as const;

export function projectile(speed: number, angleDeg: number, height = 0, g: number = GRAVITY.earth) {
  const a = (angleDeg * Math.PI) / 180;
  const vx = speed * Math.cos(a);
  const vy = speed * Math.sin(a);
  // Time when y returns to 0: h + vy t − g t²/2 = 0.
  const flightTime = (vy + Math.sqrt(vy * vy + 2 * g * height)) / g;
  const range = vx * flightTime;
  const maxHeight = height + (vy > 0 ? (vy * vy) / (2 * g) : 0);
  const points = (n = 60) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const t = (flightTime * i) / n;
      return { t, x: vx * t, y: Math.max(0, height + vy * t - (g * t * t) / 2) };
    });
  return { flightTime, range, maxHeight, points };
}

export function motionAt(x0: number, v0: number, a: number, t: number) {
  return { x: x0 + v0 * t + 0.5 * a * t * t, v: v0 + a * t };
}

export function circuit(voltage: number, r1: number, r2: number, mode: "series" | "parallel") {
  const total = mode === "series" ? r1 + r2 : (r1 * r2) / (r1 + r2);
  const current = voltage / total;
  if (mode === "series") {
    return { total, current, v1: current * r1, v2: current * r2, i1: current, i2: current, power: voltage * current };
  }
  return { total, current, v1: voltage, v2: voltage, i1: voltage / r1, i2: voltage / r2, power: voltage * current };
}

/** Probability of each sum when rolling `dice` fair six-sided dice. */
export function diceDistribution(dice: number): { sum: number; p: number }[] {
  let dist = new Map<number, number>([[0, 1]]);
  for (let d = 0; d < dice; d++) {
    const next = new Map<number, number>();
    for (const [s, p] of dist) for (let f = 1; f <= 6; f++) next.set(s + f, (next.get(s + f) ?? 0) + p / 6);
    dist = next;
  }
  return [...dist.entries()].sort((a, b) => a[0] - b[0]).map(([sum, p]) => ({ sum, p }));
}

/** Small seeded PRNG so a class can reproduce the same "random" run. */
export function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function leastSquares(points: { x: number; y: number }[]) {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  const sxx = points.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  const sxy = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  const ssTot = points.reduce((s, p) => s + (p.y - my) ** 2, 0);
  const sse = sumSquaredErrors(points, slope, intercept);
  return { slope, intercept, sse, r2: ssTot === 0 ? 1 : 1 - sse / ssTot };
}

export function sumSquaredErrors(points: { x: number; y: number }[], slope: number, intercept: number) {
  return points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
}

/**
 * Practice data for the linear-model simulation: spring extension (cm) for
 * hanging masses (g). Clearly labelled in the UI as sample practice data.
 */
export const SPRING_SAMPLE = [
  { x: 0, y: 0.1 },
  { x: 50, y: 1.9 },
  { x: 100, y: 4.2 },
  { x: 150, y: 5.8 },
  { x: 200, y: 8.1 },
  { x: 250, y: 9.9 },
  { x: 300, y: 12.2 },
];

export function exponentialGrowth(p0: number, r: number, t: number) {
  return p0 * Math.exp(r * t);
}

export function logisticGrowth(p0: number, r: number, k: number, t: number) {
  return k / (1 + ((k - p0) / p0) * Math.exp(-r * t));
}

// ---------------------------------------------------------------- Grid robot

export type RobotCommand = "forward" | "left" | "right";
export type Heading = 0 | 1 | 2 | 3; // 0 = north, 1 = east, 2 = south, 3 = west

export interface RobotLevel {
  size: number;
  start: { x: number; y: number; heading: Heading };
  goal: { x: number; y: number };
  walls: { x: number; y: number }[];
  maxCommands: number;
}

export const ROBOT_LEVEL: RobotLevel = {
  size: 6,
  start: { x: 0, y: 5, heading: 0 },
  goal: { x: 5, y: 0 },
  walls: [
    { x: 0, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    { x: 3, y: 4 },
    { x: 4, y: 4 },
    { x: 5, y: 4 },
    { x: 4, y: 1 },
  ],
  maxCommands: 40,
};

/** A program is a list of steps; a step may repeat a command several times. */
export type RobotStep = { command: RobotCommand; times: number };

export function runRobot(level: RobotLevel, program: RobotStep[]) {
  let { x, y, heading } = level.start;
  const path: { x: number; y: number; heading: Heading }[] = [{ x, y, heading }];
  let crashed = false;
  let executed = 0;
  outer: for (const step of program) {
    for (let i = 0; i < step.times; i++) {
      executed += 1;
      if (executed > 200) break outer;
      if (step.command === "left") heading = ((heading + 3) % 4) as Heading;
      else if (step.command === "right") heading = ((heading + 1) % 4) as Heading;
      else {
        const nx = x + (heading === 1 ? 1 : heading === 3 ? -1 : 0);
        const ny = y + (heading === 2 ? 1 : heading === 0 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= level.size || ny >= level.size || level.walls.some((w) => w.x === nx && w.y === ny)) {
          crashed = true;
          break outer;
        }
        x = nx;
        y = ny;
      }
      path.push({ x, y, heading });
    }
  }
  return { path, crashed, reached: !crashed && x === level.goal.x && y === level.goal.y, steps: program.length, executed };
}
