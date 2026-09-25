import { handler, json } from "@/lib/http/api";
import { getAIStatus } from "@/lib/ai";

export const GET = handler(async () => json(getAIStatus()));
