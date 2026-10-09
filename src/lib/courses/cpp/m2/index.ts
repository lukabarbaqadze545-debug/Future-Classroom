import { T } from "../../author";
import type { Module } from "../../types";
import { l1 } from "./l1";

export const module2: Module = {
  id: "cpp-m2",
  number: 2,
  title: T("გადაწყვეტილებები", "Decisions"),
  summary: T("პროგრამა არჩევს: შედარება, ლოგიკა, `if`, `else`, `switch`. მზადდება: პირველი გაკვეთილი უკვე ხელმისაწვდომია, დანარჩენი მალე დაემატება.", "The program chooses: comparison, logic, `if`, `else`, `switch`. In progress: the first lesson is ready, the rest is coming soon."),
  outcomes: [T("დაწერ პროგრამას, რომელიც პირობის მიხედვით სხვადასხვა გზას ირჩევს")],
  lessons: [l1],
};
