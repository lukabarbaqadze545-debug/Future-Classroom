import { T } from "../author";
import type { Course } from "../types";
import { module1 } from "./m1";
import { planned } from "./planned";

export const cppCourse: Course = {
  id: "cpp",
  language: "cpp",
  title: T("C++ — პროგრამირება ნულიდან", "C++ — programming from zero"),
  tagline: T("ისწავლე დაწერო პროგრამები, რომლებიც მართლა მუშაობს: წერ კოდს აქვე, გაუშვებ და სერვერი ამოწმებს.", "Learn to write programs that really work: write code right here, run it, and the server checks it."),
  audience: T(
    "მოსწავლეებისთვის, რომლებსაც პროგრამირება არასოდეს შეუსწავლიათ. კომპიუტერთან მუშაობის გარდა არაფერი გჭირდება: არც დაყენებული პროგრამა, არც ანგარიში.",
    "For students who have never programmed. You need nothing but a computer: no software to install, no account.",
  ),
  modules: [module1],
  planned,
};
