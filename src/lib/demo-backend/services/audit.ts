import "server-only";

import type { DemoBackendState } from "../types";

export type AuditCategory = "Workflow" | "EVC" | "Compliance";

export function getAuditEvents(state: DemoBackendState) {
  return [
    ...state.workflowHistory.map((entry) => ({ ...entry, category: (entry.action.startsWith("EVC") ? "EVC" : "Workflow") as AuditCategory, recordId: entry.applicationId })),
    ...state.complianceActivity.map((entry) => ({ ...entry, category: "Compliance" as AuditCategory, reason: entry.detail })),
  ].sort((first, second) => second.occurredAt.localeCompare(first.occurredAt));
}
