import { z } from "zod";
import { jsonSuccess, jsonValidationError } from "@/lib/demo-backend/http";
import { readDemoState } from "@/lib/demo-backend/route-utils";
import { getAuditEvents } from "@/lib/demo-backend/services/audit";
import { demoRoleSchema, parseSearchParams } from "@/lib/demo-backend/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({ category: z.enum(["Workflow", "EVC", "Compliance"]).optional(), role: demoRoleSchema.optional(), search: z.string().trim().max(200).optional() }).strict();

export async function GET(request: Request) {
  const query = parseSearchParams(request.url, querySchema);
  if (!query.success) return jsonValidationError(query.issues);
  const result = await readDemoState();
  if ("response" in result) return result.response;
  const search = query.data.search?.toLowerCase();
  const events = getAuditEvents(result.state).filter((event) => (!query.data.category || event.category === query.data.category) && (!query.data.role || event.actorRole === query.data.role) && (!search || `${event.applicationId} ${event.actorRole} ${event.action} ${event.reason ?? ""}`.toLowerCase().includes(search)));
  return jsonSuccess({ events, revision: result.state.revision, updatedAt: result.state.updatedAt });
}
