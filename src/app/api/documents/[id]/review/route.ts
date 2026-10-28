import { z } from "zod";
import { jsonError, jsonSuccess, jsonValidationError } from "@/lib/demo-backend/http";
import { demoStateRepository } from "@/lib/demo-backend/repository";
import { ComplianceMutationError, reviewDocumentRenewal } from "@/lib/demo-backend/services/compliance";
import { demoRoleSchema, documentIdSchema, isoCalendarDateSchema, parseRequestPayload, requiredReasonSchema } from "@/lib/demo-backend/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({ decision: z.enum(["verify", "return"]), demoRole: demoRoleSchema, reason: z.string().trim().max(2_000).optional(), renewedExpiresAt: isoCalendarDateSchema.optional() }).strict().superRefine((value, context) => { if (value.decision === "return") { const parsed = requiredReasonSchema.safeParse(value.reason); if (!parsed.success) parsed.error.issues.forEach((issue) => context.addIssue({ ...issue, path: ["reason"] })); } if (value.decision === "verify" && !value.renewedExpiresAt) context.addIssue({ code: "custom", message: "A fictional new validity date is required for demo verification.", path: ["renewedExpiresAt"] }); });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsedId = documentIdSchema.safeParse((await params).id);
  if (!parsedId.success) return jsonValidationError(parsedId.error.issues);
  const payload = await parseRequestPayload(request, requestSchema);
  if (!payload.success) return jsonValidationError(payload.issues);
  try { return jsonSuccess(await reviewDocumentRenewal(demoStateRepository, parsedId.data, payload.data.demoRole, payload.data.decision, payload.data.reason, payload.data.renewedExpiresAt)); }
  catch (error) { return complianceError(error); }
}

function complianceError(error: unknown) {
  if (error instanceof ComplianceMutationError) return jsonError(error.code, error.message, error.code === "VALIDATION_ERROR" ? 400 : error.code === "NOT_FOUND" ? 404 : error.code === "DEMO_POLICY_DENIED" ? 403 : 409);
  return jsonError("INTERNAL_ERROR", "The compliance demo action could not be completed.", 500);
}
