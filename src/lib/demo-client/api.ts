import type { DemoApplication, DemoComplianceActivity, DemoDocument, DemoUndertaking, DemoWorkflowHistoryEntry } from "@/features/dashboard/types";
import type { DemoRole } from "@/types/roles";

type ApiErrorEnvelope = { error: { code: string; fieldErrors?: Record<string, string[]>; message: string } };
type ApiEnvelope<T> = { data: T };

export class DemoApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string, readonly fieldErrors?: Record<string, string[]>) { super(message); this.name = "DemoApiError"; }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...init?.headers }, cache: "no-store" });
  const body = await response.json().catch(() => null) as ApiEnvelope<T> | ApiErrorEnvelope | null;
  if (!response.ok || !body || !("data" in body)) {
    const error = body && "error" in body ? body.error : undefined;
    throw new DemoApiError(error?.message ?? "The demo server request failed.", response.status, error?.code, error?.fieldErrors);
  }
  return body.data;
}

type AuditWorkflow = DemoWorkflowHistoryEntry & { category: "Workflow" | "EVC"; recordId: string };
type AuditCompliance = DemoComplianceActivity & { category: "Compliance"; reason?: string };

export async function loadDemoSnapshot() {
  const [applicationResponse, undertakingResponse, documentResponse, auditResponse, alertResponse] = await Promise.all([
    request<{ applications: DemoApplication[] }>("/api/applications"),
    request<{ undertakings: Array<{ undertaking: DemoUndertaking }> }>("/api/undertakings"),
    request<{ documents: Array<{ document: DemoDocument }> }>("/api/documents"),
    request<{ events: Array<AuditWorkflow | AuditCompliance> }>("/api/audit"),
    request<{ alerts: Array<{ key: string; read: boolean }> }>("/api/alerts"),
  ]);
  const events = auditResponse.events;
  return {
    applications: applicationResponse.applications,
    complianceActivity: events.filter((event): event is AuditCompliance => event.category === "Compliance").map((event) => ({ action: event.action, actorRole: event.actorRole, applicationId: event.applicationId, detail: event.detail, id: event.id, occurredAt: event.occurredAt, recordId: event.recordId, recordType: event.recordType })),
    documents: documentResponse.documents.map((item) => item.document),
    readAlertKeys: alertResponse.alerts.filter((alert) => alert.read).map((alert) => alert.key),
    undertakings: undertakingResponse.undertakings.map((item) => item.undertaking),
    workflowHistory: events.filter((event): event is AuditWorkflow => event.category !== "Compliance").map((event) => ({ action: event.action, actorRole: event.actorRole, applicationId: event.applicationId, fromStage: event.fromStage, id: event.id, occurredAt: event.occurredAt, reason: event.reason, toStage: event.toStage })),
  };
}

export const demoApi = {
  forward: (id: string, demoRole: DemoRole) => request<{ application: DemoApplication; historyEntry: DemoWorkflowHistoryEntry }>(`/api/applications/${id}/workflow/forward`, { body: JSON.stringify({ demoRole }), method: "POST" }),
  returnWorkflow: (id: string, demoRole: DemoRole, destinationStage: string, reason: string) => request<{ application: DemoApplication; historyEntry: DemoWorkflowHistoryEntry }>(`/api/applications/${id}/workflow/return`, { body: JSON.stringify({ demoRole, destinationStage, reason }), method: "POST" }),
  scheduleEvc: (id: string, payload: Record<string, unknown>) => request<{ application: DemoApplication; historyEntry: DemoWorkflowHistoryEntry }>(`/api/applications/${id}/evc/schedule`, { body: JSON.stringify(payload), method: "POST" }),
  completeEvc: (id: string, payload: Record<string, unknown>) => request<{ application: DemoApplication; historyEntry: DemoWorkflowHistoryEntry }>(`/api/applications/${id}/evc/complete`, { body: JSON.stringify(payload), method: "POST" }),
  submitUndertaking: (id: string, payload: Record<string, unknown>) => request<{ record: DemoUndertaking; activity: DemoComplianceActivity }>(`/api/undertakings/${id}/submit`, { body: JSON.stringify(payload), method: "POST" }),
  reviewUndertaking: (id: string, payload: Record<string, unknown>) => request<{ record: DemoUndertaking; activity: DemoComplianceActivity }>(`/api/undertakings/${id}/review`, { body: JSON.stringify(payload), method: "POST" }),
  submitDocumentRenewal: (id: string, payload: Record<string, unknown>) => request<{ record: DemoDocument; activity: DemoComplianceActivity }>(`/api/documents/${id}/renewal`, { body: JSON.stringify(payload), method: "POST" }),
  reviewDocumentRenewal: (id: string, payload: Record<string, unknown>) => request<{ record: DemoDocument; activity: DemoComplianceActivity }>(`/api/documents/${id}/review`, { body: JSON.stringify(payload), method: "POST" }),
  setAlertRead: (id: string, read: boolean) => request<{ readAlertKeys: string[] }>(`/api/alerts/${encodeURIComponent(id)}/read`, { body: JSON.stringify({ read }), method: "PATCH" }),
};
