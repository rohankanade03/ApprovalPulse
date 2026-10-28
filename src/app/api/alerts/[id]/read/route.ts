import { z } from "zod";
import { jsonError, jsonSuccess, jsonValidationError } from "@/lib/demo-backend/http";
import { demoStateRepository } from "@/lib/demo-backend/repository";
import { AlertReadMutationError, setAlertRead } from "@/lib/demo-backend/services/alerts";
import { parseRequestPayload } from "@/lib/demo-backend/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({ read: z.boolean() }).strict();
const alertKeySchema = z.string().trim().min(1).max(250);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const key = alertKeySchema.safeParse((await params).id);
  if (!key.success) return jsonValidationError(key.error.issues);
  const payload = await parseRequestPayload(request, requestSchema);
  if (!payload.success) return jsonValidationError(payload.issues);
  try {
    return jsonSuccess(await setAlertRead(demoStateRepository, key.data, payload.data.read));
  } catch (error) {
    if (error instanceof AlertReadMutationError) return jsonError("NOT_FOUND", error.message, 404);
    return jsonError("INTERNAL_ERROR", "The demo alert state could not be updated.", 500);
  }
}
