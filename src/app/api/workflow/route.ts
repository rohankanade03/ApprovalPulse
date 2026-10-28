import { z } from "zod";
import { jsonSuccess, jsonValidationError } from "@/lib/demo-backend/http";
import { readDemoState } from "@/lib/demo-backend/route-utils";
import { getWorkflowQueue } from "@/lib/demo-backend/services/workflow";
import { parseSearchParams } from "@/lib/demo-backend/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({ region: z.enum(["North", "South", "East", "West", "Central"]).optional(), search: z.string().trim().max(200).optional(), stage: z.enum(["Initial Scrutiny", "Re-Scrutiny", "Awaiting EVC", "EVC Completed", "SAC/SHC Review", "Compliance Review"]).optional(), status: z.enum(["Pending", "In Review", "Overdue", "Completed"]).optional() }).strict();

export async function GET(request: Request) {
  const query = parseSearchParams(request.url, querySchema);
  if (!query.success) return jsonValidationError(query.issues);
  const result = await readDemoState();
  if ("response" in result) return result.response;
  const search = query.data.search?.toLowerCase();
  const queue = getWorkflowQueue(result.state).filter(({ application }) => (!query.data.region || application.region === query.data.region) && (!query.data.stage || application.stage === query.data.stage) && (!query.data.status || application.status === query.data.status) && (!search || `${application.id} ${application.institution}`.toLowerCase().includes(search)));
  return jsonSuccess({ queue, revision: result.state.revision, updatedAt: result.state.updatedAt });
}
