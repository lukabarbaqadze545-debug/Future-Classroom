import { l, type L } from "../localized";

/**
 * A small, stable skills framework shared by the portfolio, the career
 * explorer and self-assessment. Ids never change; labels are bilingual.
 */
export const SKILLS = [
  { id: "problem_solving", name: l("Problem solving", "პრობლემის გადაჭრა"), group: "thinking" },
  { id: "critical_thinking", name: l("Critical thinking", "კრიტიკული აზროვნება"), group: "thinking" },
  { id: "math_reasoning", name: l("Mathematical reasoning", "მათემატიკური მსჯელობა"), group: "thinking" },
  { id: "programming", name: l("Programming", "პროგრამირება"), group: "technical" },
  { id: "data_analysis", name: l("Data analysis", "მონაცემთა ანალიზი"), group: "technical" },
  { id: "scientific_inquiry", name: l("Scientific inquiry", "სამეცნიერო კვლევა"), group: "technical" },
  { id: "engineering_design", name: l("Engineering design", "საინჟინრო დიზაინი"), group: "technical" },
  { id: "research", name: l("Research and sources", "კვლევა და წყაროები"), group: "thinking" },
  { id: "communication", name: l("Communication", "კომუნიკაცია"), group: "people" },
  { id: "collaboration", name: l("Teamwork", "გუნდური მუშაობა"), group: "people" },
  { id: "leadership", name: l("Leadership", "ლიდერობა"), group: "people" },
  { id: "creativity", name: l("Creativity", "კრეატიულობა"), group: "thinking" },
  { id: "digital_literacy", name: l("Digital literacy", "ციფრული წიგნიერება"), group: "technical" },
  { id: "self_management", name: l("Self-management", "თვითორგანიზება"), group: "people" },
  { id: "languages", name: l("Foreign languages", "უცხო ენები"), group: "people" },
] as const satisfies readonly { id: string; name: L; group: "thinking" | "technical" | "people" }[];

export type SkillId = (typeof SKILLS)[number]["id"];
export const SKILL_IDS = SKILLS.map((s) => s.id) as [SkillId, ...SkillId[]];

export function skillName(id: string): L {
  return SKILLS.find((s) => s.id === id)?.name ?? { en: id, ka: id };
}

/** Self-assessment scale used across the career lab. */
export const SKILL_LEVELS = [1, 2, 3, 4] as const;
