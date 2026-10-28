import "server-only";

import { randomUUID } from "node:crypto";
import { demoRolePolicy, getWorkflowRoute } from "@/features/workflow/config";
import type { ApplicationStage, DemoWorkflowHistoryEntry } from "@/features/dashboard/types";
import type { DemoRole } from "@/types/roles";
import type { DemoBackendState, DemoStateRepository } from "../types";
import { isDemoWorkflowOverdue } from "./shared";

export type WorkflowMutationFailureCode = "VALIDATION_ERROR" | "NOT_FOUND" | "DEMO_POLICY_DENIED" | "CONFLICT";

export class WorkflowMutationError extends Error {
  constructor(readonly code: WorkflowMutationFailureCode, message: string) {
    super(message);
    this.name = "WorkflowMutationError";
  }
}

export function getWorkflowQueue(state: DemoBackendState) {
  return state.applications.map((application) => ({
    application,
    historyCount: state.workflowHistory.filter((entry) => entry.applicationId === application.id).length,
    isOverdue: isDemoWorkflowOverdue(application),
    route: getWorkflowRoute(application),
  }));
}

export function getWorkflowDetail(state: DemoBackendState, applicationId: string) {
  const application = state.applications.find((item) => item.id === applicationId);
  if (!application) return undefined;
  return {
    application,
    history: state.workflowHistory.filter((entry) => entry.applicationId === applicationId).sort((first, second) => second.occurredAt.localeCompare(first.occurredAt)),
    isOverdue: isDemoWorkflowOverdue(application),
    route: getWorkflowRoute(application),
  };
}

export async function forwardWorkflowApplication(repository: DemoStateRepository, applicationId: string, role: DemoRole) {
  let historyEntry: DemoWorkflowHistoryEntry | undefined;
  const persisted = await repository.update((state) => {
    const application = state.applications.find((item) => item.id === applicationId);
    if (!application) throw new WorkflowMutationError("NOT_FOUND", "The requested demo application was not found.");
    if (application.status === "Completed") throw new WorkflowMutationError("CONFLICT", "Completed demo records cannot be forwarded.");
    if (!demoRolePolicy[role].forwardStages.includes(application.stage)) throw new WorkflowMutationError("DEMO_POLICY_DENIED", `${role} cannot forward this illustrative workflow stage.`);
    const route = getWorkflowRoute(application);
    const nextStage = route[route.indexOf(application.stage) + 1];
    if (!nextStage) throw new WorkflowMutationError("CONFLICT", "No next stage is configured for this illustrative workflow route.");
    historyEntry = createHistoryEntry(application.id, role, "Forward", application.stage, nextStage);
    const timestamp = historyEntry.occurredAt;
    state.applications = state.applications.map((item) => item.id === applicationId ? { ...item, lastUpdatedAt: dateOnly(timestamp), stage: nextStage, stageEnteredAt: dateOnly(timestamp), status: "In Review" } : item);
    state.workflowHistory.push(historyEntry);
    return state;
  });
  const application = persisted.applications.find((item) => item.id === applicationId);
  if (!application || !historyEntry) throw new Error("Workflow mutation did not return the expected demo state.");
  return { application, historyEntry, revision: persisted.revision, updatedAt: persisted.updatedAt };
}

export async function returnWorkflowApplication(repository: DemoStateRepository, applicationId: string, role: DemoRole, destinationStage: ApplicationStage, reason: string) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new WorkflowMutationError("VALIDATION_ERROR", "A return reason is required.");
  let historyEntry: DemoWorkflowHistoryEntry | undefined;
  const persisted = await repository.update((state) => {
    const application = state.applications.find((item) => item.id === applicationId);
    if (!application) throw new WorkflowMutationError("NOT_FOUND", "The requested demo application was not found.");
    if (application.status === "Completed") throw new WorkflowMutationError("CONFLICT", "Completed demo records cannot be returned through this illustrative workflow.");
    if (!demoRolePolicy[role].returnStages.includes(application.stage)) throw new WorkflowMutationError("DEMO_POLICY_DENIED", `${role} cannot return this illustrative workflow stage.`);
    const route = getWorkflowRoute(application);
    const currentIndex = route.indexOf(application.stage);
    if (currentIndex <= 0 || !route.slice(0, currentIndex).includes(destinationStage)) throw new WorkflowMutationError("CONFLICT", "Choose an earlier stage from this application's configured illustrative route.");
    historyEntry = createHistoryEntry(application.id, role, "Return", application.stage, destinationStage, trimmedReason);
    const timestamp = historyEntry.occurredAt;
    state.applications = state.applications.map((item) => item.id === applicationId ? { ...item, lastUpdatedAt: dateOnly(timestamp), stage: destinationStage, stageEnteredAt: dateOnly(timestamp), status: "Pending" } : item);
    state.workflowHistory.push(historyEntry);
    return state;
  });
  const application = persisted.applications.find((item) => item.id === applicationId);
  if (!application || !historyEntry) throw new Error("Workflow mutation did not return the expected demo state.");
  return { application, historyEntry, revision: persisted.revision, updatedAt: persisted.updatedAt };
}

function createHistoryEntry(applicationId: string, role: DemoRole, action: "Forward" | "Return", fromStage: ApplicationStage, toStage: ApplicationStage, reason?: string): DemoWorkflowHistoryEntry {
  return { action, actorRole: role, applicationId, fromStage, id: `workflow-${randomUUID()}`, occurredAt: new Date().toISOString(), ...(reason ? { reason } : {}), toStage };
}

function dateOnly(timestamp: string) {
  return timestamp.slice(0, 10);
}
