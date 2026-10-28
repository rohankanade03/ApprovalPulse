import { z } from "zod";
import { jsonError, jsonSuccess, jsonValidationError } from "@/lib/demo-backend/http";
import { demoStateRepository } from "@/lib/demo-backend/repository";
import { EvcMutationError, scheduleEvcVisit } from "@/lib/demo-backend/services/evc";
import { applicationIdSchema, demoRoleSchema, isoCalendarDateSchema, nonEmptyDemoTextSchema, parseRequestPayload, requiredReasonSchema } from "@/lib/demo-backend/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({ committeeName: nonEmptyDemoTextSchema, demoRole: demoRoleSchema, members: nonEmptyDemoTextSchema, note: z.string().trim().max(2_000).optional(), rescheduleReason: requiredReasonSchema.optional(), scheduledAt: isoCalendarDateSchema }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsedId = applicationIdSchema.safeParse((await params).id);
  if (!parsedId.success) return jsonValidationError(parsedId.error.issues);
  const payload = await parseRequestPayload(request, requestSchema);
  if (!payload.success) return jsonValidationError(payload.issues);
  try {
    return jsonSuccess(await scheduleEvcVisit(demoStateRepository, parsedId.data, payload.data.demoRole, payload.data));
  } catch (error) {
    if (error instanceof EvcMutationError) return jsonError(error.code, error.message, error.code === "VALIDATION_ERROR" ? 400 : error.code === "NOT_FOUND" ? 404 : error.code === "DEMO_POLICY_DENIED" ? 403 : 409);
    return jsonError("INTERNAL_ERROR", "The EVC demo action could not be completed.", 500);
  }
}
