import "server-only";
import { schoolTimeZone } from "@/lib/config";
import { dayKey } from "@/lib/engagement/model";

/** The school day it is now. */
export function todayInSchool(now: Date = new Date()): string {
  return dayKey(now, schoolTimeZone());
}
