import { z } from "zod";
import { jsonError, jsonSuccess, jsonValidationError } from "@/lib/demo-backend/http";
import { demoStateRepository } from "@/lib/demo-backend/repository";
import { returnWorkflowApplication, WorkflowMutationError } from "@/lib/demo-backend/services/workflow";
import { applicationIdSchema, applicationStageSchema, demoRoleSchema, parseRequestPayload, requiredReasonSchema } from "@/lib/demo-backend/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({ demoRole: demoRoleSchema, destinationStage: applicationStageSchema, reason: requiredReasonSchema }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsedId = applicationIdSchema.safeParse((await params).id);
  if (!parsedId.success) return jsonValidationError(parsedId.error.issues);
  const payload = await parseRequestPayload(request, requestSchema);
  if (!payload.success) return jsonValidationError(payload.issues);
  try {
    return jsonSuccess(await returnWorkflowApplication(demoStateRepository, parsedId.data, payload.data.demoRole, payload.data.destinationStage, payload.data.reason));
  } catch (error) {
    if (error instanceof WorkflowMutationError) return jsonError(error.code, error.message, error.code === "VALIDATION_ERROR" ? 400 : error.code === "NOT_FOUND" ? 404 : error.code === "DEMO_POLICY_DENIED" ? 403 : 409);
    return jsonError("INTERNAL_ERROR", "The workflow demo action could not be completed.", 500);
  }
}
