import { z } from "zod";
import { jsonError, jsonSuccess, jsonValidationError } from "@/lib/demo-backend/http";
import { demoStateRepository } from "@/lib/demo-backend/repository";
import { completeEvcVisit, EvcMutationError } from "@/lib/demo-backend/services/evc";
import { applicationIdSchema, demoRoleSchema, isoCalendarDateSchema, parseRequestPayload } from "@/lib/demo-backend/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({ completedAt: isoCalendarDateSchema, demoRole: demoRoleSchema, note: z.string().trim().max(2_000).optional() }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsedId = applicationIdSchema.safeParse((await params).id);
  if (!parsedId.success) return jsonValidationError(parsedId.error.issues);
  const payload = await parseRequestPayload(request, requestSchema);
  if (!payload.success) return jsonValidationError(payload.issues);
  try {
    return jsonSuccess(await completeEvcVisit(demoStateRepository, parsedId.data, payload.data.demoRole, payload.data.completedAt, payload.data.note));
  } catch (error) {
    if (error instanceof EvcMutationError) return jsonError(error.code, error.message, error.code === "VALIDATION_ERROR" ? 400 : error.code === "NOT_FOUND" ? 404 : error.code === "DEMO_POLICY_DENIED" ? 403 : 409);
    return jsonError("INTERNAL_ERROR", "The EVC demo action could not be completed.", 500);
  }
}
