import { T } from "../../author";
import type { Module } from "../../types";
import { l1 } from "./l1";
import { l2 } from "./l2";
import { l3 } from "./l3";
import { l4 } from "./l4";
import { l5 } from "./l5";
import { l6 } from "./l6";
import { l7 } from "./l7";
import { l8 } from "./l8";

export const module1: Module = {
  id: "cpp-m1",
  number: 1,
  title: T("პირველი ნაბიჯები", "First steps"),
  summary: T("პირველი პროგრამები: გამოტანა, ცვლადები, შეტანა და არითმეტიკა.", "Your first programs: output, variables, input and arithmetic."),
  outcomes: [T("დაწერ პროგრამას, რომელიც კითხულობს რიცხვებს და ბეჭდავს ანგარიშის შედეგს")],
  lessons: [l1, l2, l3, l4, l5, l6, l7, l8],
};
