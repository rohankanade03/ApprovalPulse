import { z } from "zod";
import { jsonSuccess, jsonValidationError } from "@/lib/demo-backend/http";
import { readDemoState } from "@/lib/demo-backend/route-utils";
import { getAlerts } from "@/lib/demo-backend/services/alerts";
import { parseSearchParams } from "@/lib/demo-backend/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({ category: z.enum(["Workflow", "EVC", "Undertaking", "Document Expiry"]).optional(), read: z.enum(["read", "unread"]).optional(), search: z.string().trim().max(200).optional(), severity: z.enum(["Critical", "High", "Medium", "Low"]).optional() }).strict();

export async function GET(request: Request) {
  const query = parseSearchParams(request.url, querySchema);
  if (!query.success) return jsonValidationError(query.issues);
  const result = await readDemoState();
  if ("response" in result) return result.response;
  const search = query.data.search?.toLowerCase();
  const alerts = getAlerts(result.state).filter((alert) => (!query.data.category || alert.category === query.data.category) && (!query.data.severity || alert.severity === query.data.severity) && (!query.data.read || (query.data.read === "read") === alert.read) && (!search || `${alert.applicationId} ${alert.institution} ${alert.title} ${alert.message}`.toLowerCase().includes(search)));
  return jsonSuccess({ alerts, revision: result.state.revision, updatedAt: result.state.updatedAt });
}
