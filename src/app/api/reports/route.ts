import { z } from "zod";
import { jsonSuccess, jsonValidationError } from "@/lib/demo-backend/http";
import { readDemoState } from "@/lib/demo-backend/route-utils";
import { getReport } from "@/lib/demo-backend/services/reporting";
import { parseSearchParams } from "@/lib/demo-backend/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({ range: z.enum(["7d", "30d", "quarter"]).optional(), region: z.enum(["North", "South", "East", "West", "Central"]).optional(), search: z.string().trim().max(200).optional(), stage: z.enum(["Initial Scrutiny", "Re-Scrutiny", "Awaiting EVC", "EVC Completed", "SAC/SHC Review", "Compliance Review"]).optional(), status: z.enum(["Pending", "In Review", "Overdue", "Completed"]).optional() }).strict();

export async function GET(request: Request) {
  const query = parseSearchParams(request.url, querySchema);
  if (!query.success) return jsonValidationError(query.issues);
  const result = await readDemoState();
  if ("response" in result) return result.response;
  return jsonSuccess({ ...getReport(result.state, query.data), revision: result.state.revision, updatedAt: result.state.updatedAt });
}
