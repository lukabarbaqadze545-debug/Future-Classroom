import "server-only";
import type { Locale } from "@/lib/i18n/config";
import { tr } from "./localized";
import { getProblem } from "./programming/service";
import { findExercise } from "./critical/catalog";
import { findExperiment } from "./stem/experiments";
import { findSimulation } from "./stem/simulations";
import { findChallengeSet } from "./stem/service";

/** Resolves a (kind, id) reference to a lab activity into a title and link. */
export function resolveActivity(kind: string, id: string, locale: Locale): { title: string; href: string } | null {
  switch (kind) {
    case "programming": {
      const p = getProblem(id);
      return p ? { title: tr(p.title, locale), href: `/labs/programming/${id}` } : null;
    }
    case "critical": {
      const e = findExercise(id);
      return e ? { title: tr(e.title, locale), href: `/labs/critical-thinking/${id}` } : null;
    }
    case "experiment": {
      const e = findExperiment(id);
      return e ? { title: tr(e.title, locale), href: `/labs/stem/experiments/${id}` } : null;
    }
    case "simulation": {
      const s = findSimulation(id);
      return s ? { title: tr(s.title, locale), href: `/labs/stem/simulations/${id}` } : null;
    }
    case "challenge": {
      const c = findChallengeSet(id);
      return c ? { title: tr(c.title, locale), href: `/labs/stem/challenges/${id}` } : null;
    }
    default:
      return null;
  }
}
