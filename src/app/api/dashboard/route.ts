import { z } from "zod";
import { jsonSuccess, jsonValidationError } from "@/lib/demo-backend/http";
import { readDemoState } from "@/lib/demo-backend/route-utils";
import { getDashboardSummary } from "@/lib/demo-backend/services/reporting";
import { parseSearchParams } from "@/lib/demo-backend/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({ region: z.enum(["North", "South", "East", "West", "Central"]).optional(), range: z.enum(["7d", "30d", "quarter"]).optional() }).strict();

export async function GET(request: Request) {
  const query = parseSearchParams(request.url, querySchema);
  if (!query.success) return jsonValidationError(query.issues);
  const result = await readDemoState();
  if ("response" in result) return result.response;
  return jsonSuccess({ ...getDashboardSummary(result.state, query.data), demoReferenceDate: "2026-10-26T10:30:00+05:30", revision: result.state.revision });
}
