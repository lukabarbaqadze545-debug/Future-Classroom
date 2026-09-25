"use client";

import { useState } from "react";
import { Dices } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { diceDistribution, mulberry32 } from "@/lib/labs/stem/physics";
import { Button } from "@/components/ui/button";
import { BarChart } from "../../charts";
import { Segmented } from "../sim-controls";

export function ProbabilitySim() {
  const { dict } = useI18n();
  const s = dict.labs.stem.simulations;
  const [dice, setDice] = useState<1 | 2 | 3>(2);
  const [counts, setCounts] = useState<Map<number, number>>(new Map());
  const [total, setTotal] = useState(0);
  const theory = diceDistribution(dice);

  const roll = (n: number) => {
    // Runs only in the click handler; each click deliberately gets a fresh seed.
    // eslint-disable-next-line react-hooks/purity
    const random = mulberry32(Math.floor(Math.random() * 2 ** 31));
    const next = new Map(counts);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let d = 0; d < dice; d++) sum += 1 + Math.floor(random() * 6);
      next.set(sum, (next.get(sum) ?? 0) + 1);
    }
    setCounts(next);
    setTotal(total + n);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <BarChart
          title={`${s.frequency} — ${fmt(s.rolls, { n: total })}`}
          bars={theory.map((t) => ({ label: String(t.sum), value: total ? (counts.get(t.sum) ?? 0) / total : 0 }))}
          overlay={{ label: s.theory, values: theory.map((t) => t.p) }}
          xLabel={s.sum}
          yLabel={s.observed}
          width={640}
          height={300}
        />
        <p className="mt-2 text-sm text-ink-muted tabular-nums">{fmt(s.rolls, { n: total })}</p>
      </div>
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium">{s.dice}</p>
          <Segmented
            label={s.dice}
            value={String(dice) as "1" | "2" | "3"}
            options={(["1", "2", "3"] as const).map((id) => ({ id, label: id }))}
            onChange={(v) => {
              setDice(Number(v) as 1 | 2 | 3);
              setCounts(new Map());
              setTotal(0);
            }}
          />
        </div>
        {[10, 100, 1000].map((n) => (
          <Button key={n} size="lg" variant={n === 10 ? "primary" : "secondary"} className="w-full" onClick={() => roll(n)}>
            <Dices aria-hidden className="size-5" />
            {fmt(s.roll, { n })}
          </Button>
        ))}
        <Button variant="ghost" className="w-full" onClick={() => { setCounts(new Map()); setTotal(0); }}>
          {s.clear}
        </Button>
      </div>
    </div>
  );
}
