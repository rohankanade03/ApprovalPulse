import "server-only";

import { randomUUID } from "node:crypto";
import { demoEvcPolicy, isEvcEligible } from "@/features/workflow/config";
import type { DemoEvcVisit, DemoWorkflowHistoryEntry } from "@/features/dashboard/types";
import type { DemoRole } from "@/types/roles";
import type { DemoBackendState, DemoStateRepository } from "../types";
import { demoDaysSince, getServerEvcStatus } from "./shared";

export type EvcMutationFailureCode = "VALIDATION_ERROR" | "NOT_FOUND" | "DEMO_POLICY_DENIED" | "CONFLICT";

export class EvcMutationError extends Error {
  constructor(readonly code: EvcMutationFailureCode, message: string) {
    super(message);
    this.name = "EvcMutationError";
  }
}

export function getEvcQueue(state: DemoBackendState) {
  return state.applications.filter(isEvcEligible).map((application) => ({
    application,
    eligible: true,
    status: getServerEvcStatus(application),
    visit: application.evcVisit ?? null,
  }));
}

export type ScheduleEvcInput = Omit<DemoEvcVisit, "completedAt" | "completionNote"> & { rescheduleReason?: string };

export async function scheduleEvcVisit(repository: DemoStateRepository, applicationId: string, role: DemoRole, input: ScheduleEvcInput) {
  const rescheduleReason = input.rescheduleReason?.trim();
  let historyEntry: DemoWorkflowHistoryEntry | undefined;
  const persisted = await repository.update((state) => {
    const application = state.applications.find((item) => item.id === applicationId);
    if (!application) throw new EvcMutationError("NOT_FOUND", "The requested demo application was not found.");
    if (!isEvcEligible(application)) throw new EvcMutationError("CONFLICT", "This application does not use the illustrative EVC route.");
    if (!demoEvcPolicy[role].canSchedule) throw new EvcMutationError("DEMO_POLICY_DENIED", `${role} cannot schedule visits under the EVC demo policy.`);
    if (demoDaysSince(input.scheduledAt) > 0) throw new EvcMutationError("CONFLICT", "Choose the demo reference date or a future date for this visit.");
    if (application.evcVisit?.completedAt) throw new EvcMutationError("CONFLICT", "Completed visits cannot be changed through the ordinary scheduling action.");
    const action = application.evcVisit ? "EVC Rescheduled" : "EVC Scheduled";
    if (action === "EVC Rescheduled" && !rescheduleReason) throw new EvcMutationError("VALIDATION_ERROR", "A rescheduling reason is required.");
    const visit: DemoEvcVisit = { committeeName: input.committeeName.trim(), members: input.members.trim(), note: input.note?.trim() || undefined, scheduledAt: input.scheduledAt };
    historyEntry = createEvcHistory(application.id, role, action, application.stage, scheduleDetail(visit, rescheduleReason));
    const timestamp = historyEntry.occurredAt;
    state.applications = state.applications.map((item) => item.id === applicationId ? { ...item, evcVisit: visit, lastUpdatedAt: dateOnly(timestamp) } : item);
    state.workflowHistory.push(historyEntry);
    return state;
  });
  const application = persisted.applications.find((item) => item.id === applicationId);
  if (!application || !historyEntry) throw new Error("EVC mutation did not return the expected demo state.");
  return { application, historyEntry, revision: persisted.revision, updatedAt: persisted.updatedAt };
}

export async function completeEvcVisit(repository: DemoStateRepository, applicationId: string, role: DemoRole, completedAt: string, note?: string) {
  let historyEntry: DemoWorkflowHistoryEntry | undefined;
  const persisted = await repository.update((state) => {
    const application = state.applications.find((item) => item.id === applicationId);
    if (!application) throw new EvcMutationError("NOT_FOUND", "The requested demo application was not found.");
    if (!application.evcVisit) throw new EvcMutationError("CONFLICT", "A scheduled fictional EVC visit is required before completion.");
    if (!demoEvcPolicy[role].canComplete) throw new EvcMutationError("DEMO_POLICY_DENIED", `${role} cannot complete visits under the EVC demo policy.`);
    if (application.evcVisit.completedAt) throw new EvcMutationError("CONFLICT", "This fictional visit is already marked completed.");
    const completedVisit: DemoEvcVisit = { ...application.evcVisit, completedAt, completionNote: note?.trim() || undefined };
    historyEntry = createEvcHistory(application.id, role, "EVC Completed", application.stage, `Completion date: ${completedAt}${note?.trim() ? `; note: ${note.trim()}` : ""}.`);
    const timestamp = historyEntry.occurredAt;
    state.applications = state.applications.map((item) => item.id === applicationId ? { ...item, evcVisit: completedVisit, lastUpdatedAt: dateOnly(timestamp) } : item);
    state.workflowHistory.push(historyEntry);
    return state;
  });
  const application = persisted.applications.find((item) => item.id === applicationId);
  if (!application || !historyEntry) throw new Error("EVC mutation did not return the expected demo state.");
  return { application, historyEntry, revision: persisted.revision, updatedAt: persisted.updatedAt };
}

function createEvcHistory(applicationId: string, role: DemoRole, action: "EVC Scheduled" | "EVC Rescheduled" | "EVC Completed", stage: DemoWorkflowHistoryEntry["fromStage"], detail: string): DemoWorkflowHistoryEntry {
  return { action, actorRole: role, applicationId, fromStage: stage, id: `evc-${randomUUID()}`, occurredAt: new Date().toISOString(), reason: detail, toStage: stage };
}

function scheduleDetail(visit: DemoEvcVisit, rescheduleReason?: string) {
  return `${rescheduleReason ? `Reschedule reason: ${rescheduleReason}. ` : ""}Visit date: ${visit.scheduledAt}; committee: ${visit.committeeName}; members: ${visit.members}${visit.note ? `; note: ${visit.note}` : ""}.`;
}

function dateOnly(timestamp: string) {
  return timestamp.slice(0, 10);
}
