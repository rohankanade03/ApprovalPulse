import "server-only";

import { NextResponse } from "next/server";
import type { z } from "zod";

export type ApiErrorCode = "VALIDATION_ERROR" | "NOT_FOUND" | "DEMO_POLICY_DENIED" | "CONFLICT" | "INTERNAL_ERROR";

export type ApiError = {
  error: {
    code: ApiErrorCode;
    fieldErrors?: Record<string, string[]>;
    message: string;
  };
};

export type ApiSuccess<T> = { data: T };

const noStoreHeaders = { "Cache-Control": "no-store" };

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ data }, { ...init, headers: { ...noStoreHeaders, ...init?.headers } });
}

export function jsonError(code: ApiErrorCode, message: string, status: number, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json<ApiError>({ error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } }, { status, headers: noStoreHeaders });
}

export function jsonValidationError(issues: z.ZodIssue[]) {
  const fieldErrors: Record<string, string[]> = {};
  issues.forEach((issue) => {
    const field = issue.path.join(".") || "body";
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  });
  return jsonError("VALIDATION_ERROR", "The request payload is invalid.", 400, fieldErrors);
}
