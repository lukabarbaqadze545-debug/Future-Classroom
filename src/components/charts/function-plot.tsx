import { sampleFunction } from "@/lib/domain/math-expression";
import { cn } from "@/components/ui/cn";

function niceStep(range: number): number {
  const raw = range / 8;
  const power = 10 ** Math.floor(Math.log10(raw));
  const n = raw / power;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * power;
}

/**
 * Plots y = f(x) as an accessible SVG. Expressions are parsed by the safe
 * evaluator in lib/domain/math-expression (no eval).
 */
export function FunctionPlot({
  expression,
  xMin,
  xMax,
  caption,
  className,
  large = false,
}: {
  expression: string;
  xMin: number;
  xMax: number;
  caption?: string;
  className?: string;
  large?: boolean;
}) {
  let points: { x: number; y: number | null }[];
  try {
    points = sampleFunction(expression, xMin, xMax, 240);
  } catch {
    return null;
  }
  const ys = points.map((p) => p.y).filter((y): y is number => y !== null);
  if (ys.length < 2 || !(xMax > xMin)) return null;
  let yMin = Math.min(...ys, 0);
  let yMax = Math.max(...ys, 0);
  // Keep extreme values from flattening the interesting part of the curve.
  const spread = yMax - yMin || 1;
  yMin -= spread * 0.08;
  yMax += spread * 0.08;
  const W = 600;
  const H = 360;
  const pad = 36;
  const sx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * (W - pad * 2);
  const sy = (y: number) => H - pad - ((y - yMin) / (yMax - yMin)) * (H - pad * 2);
  const xStep = niceStep(xMax - xMin);
  const yStep = niceStep(yMax - yMin);
  const xTicks: number[] = [];
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) xTicks.push(Number(x.toFixed(6)));
  const yTicks: number[] = [];
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) yTicks.push(Number(y.toFixed(6)));

  let path = "";
  let penDown = false;
  for (const p of points) {
    if (p.y === null || p.y < yMin - spread * 4 || p.y > yMax + spread * 4) {
      penDown = false;
      continue;
    }
    path += `${penDown ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`;
    penDown = true;
  }
  const label = caption || `y = ${expression}`;
  return (
    <figure className={cn("rounded-xl border border-line bg-surface p-3", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full">
        <g stroke="#e2e5ea" strokeWidth={1}>
          {xTicks.map((x) => (
            <line key={`gx${x}`} x1={sx(x)} x2={sx(x)} y1={pad} y2={H - pad} />
          ))}
          {yTicks.map((y) => (
            <line key={`gy${y}`} x1={pad} x2={W - pad} y1={sy(y)} y2={sy(y)} />
          ))}
        </g>
        {yMin <= 0 && yMax >= 0 ? <line x1={pad} x2={W - pad} y1={sy(0)} y2={sy(0)} stroke="#475467" strokeWidth={1.5} /> : null}
        {xMin <= 0 && xMax >= 0 ? <line x1={sx(0)} x2={sx(0)} y1={pad} y2={H - pad} stroke="#475467" strokeWidth={1.5} /> : null}
        <g fill="#5d6679" fontSize={large ? 16 : 13} fontFamily="inherit">
          {xTicks.map((x) => (
            <text key={`tx${x}`} x={sx(x)} y={H - pad + 18} textAnchor="middle">
              {x}
            </text>
          ))}
          {yTicks.map((y) => (
            <text key={`ty${y}`} x={pad - 6} y={sy(y) + 4} textAnchor="end">
              {y}
            </text>
          ))}
        </g>
        <path d={path} fill="none" stroke="#1d4ed8" strokeWidth={large ? 4 : 3} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <figcaption className={cn("mt-2 text-center text-ink-muted", large ? "text-lg" : "text-sm")}>{label}</figcaption>
    </figure>
  );
}
