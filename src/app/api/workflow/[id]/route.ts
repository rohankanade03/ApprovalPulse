import { jsonError, jsonSuccess, jsonValidationError } from "@/lib/demo-backend/http";
import { readDemoState } from "@/lib/demo-backend/route-utils";
import { getWorkflowDetail } from "@/lib/demo-backend/services/workflow";
import { applicationIdSchema } from "@/lib/demo-backend/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsedId = applicationIdSchema.safeParse((await params).id);
  if (!parsedId.success) return jsonValidationError(parsedId.error.issues);
  const result = await readDemoState();
  if ("response" in result) return result.response;
  const detail = getWorkflowDetail(result.state, parsedId.data);
  if (!detail) return jsonError("NOT_FOUND", "The requested demo application was not found.", 404);
  return jsonSuccess(detail);
}
