import { z } from "zod";
import { jsonSuccess, jsonValidationError } from "@/lib/demo-backend/http";
import { readDemoState } from "@/lib/demo-backend/route-utils";
import { getUndertakings } from "@/lib/demo-backend/services/compliance";
import { parseSearchParams } from "@/lib/demo-backend/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({ region: z.enum(["North", "South", "East", "West", "Central"]).optional(), search: z.string().trim().max(200).optional(), status: z.enum(["Pending Submission", "Submitted for Verification", "Verified", "Returned for Correction"]).optional() }).strict();

export async function GET(request: Request) {
  const query = parseSearchParams(request.url, querySchema);
  if (!query.success) return jsonValidationError(query.issues);
  const result = await readDemoState();
  if ("response" in result) return result.response;
  const search = query.data.search?.toLowerCase();
  const undertakings = getUndertakings(result.state).filter(({ application, undertaking }) => application && (!query.data.region || application.region === query.data.region) && (!query.data.status || undertaking.status === query.data.status) && (!search || `${undertaking.applicationId} ${application.institution} ${undertaking.title}`.toLowerCase().includes(search)));
  return jsonSuccess({ undertakings, revision: result.state.revision, updatedAt: result.state.updatedAt });
}
