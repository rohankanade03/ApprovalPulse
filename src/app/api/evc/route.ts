import { z } from "zod";
import { jsonSuccess, jsonValidationError } from "@/lib/demo-backend/http";
import { readDemoState } from "@/lib/demo-backend/route-utils";
import { getEvcQueue } from "@/lib/demo-backend/services/evc";
import { parseSearchParams } from "@/lib/demo-backend/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({ region: z.enum(["North", "South", "East", "West", "Central"]).optional(), status: z.enum(["Unscheduled", "Scheduled", "Completed", "Overdue"]).optional() }).strict();

export async function GET(request: Request) {
  const query = parseSearchParams(request.url, querySchema);
  if (!query.success) return jsonValidationError(query.issues);
  const result = await readDemoState();
  if ("response" in result) return result.response;
  const visits = getEvcQueue(result.state).filter(({ application, status }) => (!query.data.region || application.region === query.data.region) && (!query.data.status || status === query.data.status));
  return jsonSuccess({ visits, revision: result.state.revision, updatedAt: result.state.updatedAt });
}
