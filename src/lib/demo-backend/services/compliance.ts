import "server-only";

import { randomUUID } from "node:crypto";
import type { DemoComplianceActivity, DemoDocument, DemoUndertaking } from "@/features/dashboard/types";
import type { DemoRole } from "@/types/roles";
import type { DemoBackendState, DemoStateRepository } from "../types";
import { getServerDocumentStatus, getServerUndertakingTiming } from "./shared";

export type ComplianceMutationFailureCode = "VALIDATION_ERROR" | "NOT_FOUND" | "DEMO_POLICY_DENIED" | "CONFLICT";

export class ComplianceMutationError extends Error {
  constructor(readonly code: ComplianceMutationFailureCode, message: string) {
    super(message);
    this.name = "ComplianceMutationError";
  }
}

export function getUndertakings(state: DemoBackendState) {
  const applications = new Map(state.applications.map((application) => [application.id, application]));
  return state.undertakings.map((undertaking) => ({
    application: applications.get(undertaking.applicationId) ?? null,
    timing: getServerUndertakingTiming(undertaking),
    undertaking,
  }));
}

export function getDocuments(state: DemoBackendState) {
  const applications = new Map(state.applications.map((application) => [application.id, application]));
  return state.documents.map((document) => ({
    application: applications.get(document.applicationId) ?? null,
    document,
    derivedStatus: getServerDocumentStatus(document),
  }));
}

export function getComplianceSummary(state: DemoBackendState) {
  const undertakings = getUndertakings(state);
  const documents = getDocuments(state);
  return {
    documents: {
      awaitingVerification: documents.filter((item) => item.derivedStatus === "Renewal Submitted").length,
      expired: documents.filter((item) => item.derivedStatus === "Expired").length,
      expiringSoon: documents.filter((item) => item.derivedStatus === "Expiring Soon").length,
    },
    undertakings: {
      awaitingVerification: undertakings.filter((item) => item.undertaking.status === "Submitted for Verification").length,
      dueSoon: undertakings.filter((item) => item.timing.dueSoon).length,
      overdue: undertakings.filter((item) => item.timing.overdue).length,
    },
  };
}

export async function submitUndertaking(repository: DemoStateRepository, undertakingId: string, role: DemoRole, evidenceFileName: string, note?: string) {
  return mutateUndertaking(repository, undertakingId, role, (record, state) => {
    if (role !== "Institution") throw new ComplianceMutationError("DEMO_POLICY_DENIED", "Only the Institution demo role may submit undertaking evidence metadata.");
    if (!["Pending Submission", "Returned for Correction"].includes(record.status)) throw new ComplianceMutationError("CONFLICT", "Only pending or returned undertakings can be submitted.");
    const updated = { ...record, evidenceFileName: evidenceFileName.trim(), note: note?.trim() || undefined, returnReason: undefined, status: "Submitted for Verification" as const, submittedAt: demoDate() };
    state.undertakings = state.undertakings.map((item) => item.id === undertakingId ? updated : item);
    const activity = createActivity(updated.applicationId, updated.id, "Undertaking", "Evidence submitted", role, note?.trim());
    state.complianceActivity.push(activity);
    return { activity, record: updated };
  });
}

export async function reviewUndertaking(repository: DemoStateRepository, undertakingId: string, role: DemoRole, decision: "verify" | "return", reason?: string) {
  const trimmedReason = reason?.trim();
  if (decision === "return" && !trimmedReason) throw new ComplianceMutationError("VALIDATION_ERROR", "A return reason is required.");
  return mutateUndertaking(repository, undertakingId, role, (record, state) => {
    requireComplianceReviewer(role);
    if (record.status !== "Submitted for Verification") throw new ComplianceMutationError("CONFLICT", "Only submitted undertaking evidence can be reviewed.");
    const updated = { ...record, returnReason: decision === "return" ? trimmedReason : undefined, status: decision === "verify" ? "Verified" as const : "Returned for Correction" as const };
    state.undertakings = state.undertakings.map((item) => item.id === undertakingId ? updated : item);
    const activity = createActivity(updated.applicationId, updated.id, "Undertaking", decision === "verify" ? "Verified" : "Returned for correction", role, trimmedReason);
    state.complianceActivity.push(activity);
    return { activity, record: updated };
  });
}

export async function submitDocumentRenewal(repository: DemoStateRepository, documentId: string, role: DemoRole, renewalFileName: string, note?: string) {
  return mutateDocument(repository, documentId, role, (record, state) => {
    if (role !== "Institution") throw new ComplianceMutationError("DEMO_POLICY_DENIED", "Only the Institution demo role may submit document renewal metadata.");
    if (["Renewal Submitted", "Renewal Verified"].includes(record.status)) throw new ComplianceMutationError("CONFLICT", "This document is already submitted or verified and cannot be resubmitted through the ordinary demo action.");
    const updated = { ...record, renewalFileName: renewalFileName.trim(), renewalNote: note?.trim() || undefined, renewalSubmittedAt: demoDate(), returnReason: undefined, status: "Renewal Submitted" as const };
    state.documents = state.documents.map((item) => item.id === documentId ? updated : item);
    const activity = createActivity(updated.applicationId, updated.id, "Document", "Renewal metadata submitted", role, note?.trim());
    state.complianceActivity.push(activity);
    return { activity, record: updated };
  });
}

export async function reviewDocumentRenewal(repository: DemoStateRepository, documentId: string, role: DemoRole, decision: "verify" | "return", reason?: string, renewedExpiresAt?: string) {
  const trimmedReason = reason?.trim();
  if (decision === "return" && !trimmedReason) throw new ComplianceMutationError("VALIDATION_ERROR", "A return reason is required.");
  if (decision === "verify" && !renewedExpiresAt) throw new ComplianceMutationError("VALIDATION_ERROR", "A fictional new validity date is required for demo verification.");
  return mutateDocument(repository, documentId, role, (record, state) => {
    requireComplianceReviewer(role);
    if (record.status !== "Renewal Submitted") throw new ComplianceMutationError("CONFLICT", "Only submitted renewals can be reviewed.");
    if (decision === "verify" && renewedExpiresAt! <= record.expiresAt) throw new ComplianceMutationError("CONFLICT", "The fictional renewed validity date must be after the current expiry date.");
    const updated: DemoDocument = decision === "verify"
      ? { ...record, renewedExpiresAt, returnReason: undefined, status: "Renewal Verified" }
      : { ...record, renewedExpiresAt: undefined, returnReason: trimmedReason, status: "Returned for Correction" };
    state.documents = state.documents.map((item) => item.id === documentId ? updated : item);
    const detail = decision === "verify" ? `Fictional validity date: ${renewedExpiresAt}` : trimmedReason;
    const activity = createActivity(updated.applicationId, updated.id, "Document", decision === "verify" ? "Renewal verified" : "Renewal returned for correction", role, detail);
    state.complianceActivity.push(activity);
    return { activity, record: updated };
  });
}

async function mutateUndertaking<T>(repository: DemoStateRepository, undertakingId: string, role: DemoRole, mutation: (record: DemoUndertaking, state: DemoBackendState) => T) {
  let result: T | undefined;
  const persisted = await repository.update((state) => {
    const record = state.undertakings.find((item) => item.id === undertakingId);
    if (!record) throw new ComplianceMutationError("NOT_FOUND", "The requested demo undertaking was not found.");
    ensureApplicationExists(state, record.applicationId);
    result = mutation(record, state);
    return state;
  });
  if (!result) throw new Error("Compliance mutation did not return the expected demo state.");
  return { ...result, revision: persisted.revision, updatedAt: persisted.updatedAt };
}

async function mutateDocument<T>(repository: DemoStateRepository, documentId: string, role: DemoRole, mutation: (record: DemoDocument, state: DemoBackendState) => T) {
  let result: T | undefined;
  const persisted = await repository.update((state) => {
    const record = state.documents.find((item) => item.id === documentId);
    if (!record) throw new ComplianceMutationError("NOT_FOUND", "The requested demo document was not found.");
    ensureApplicationExists(state, record.applicationId);
    result = mutation(record, state);
    return state;
  });
  if (!result) throw new Error("Compliance mutation did not return the expected demo state.");
  return { ...result, revision: persisted.revision, updatedAt: persisted.updatedAt };
}

function requireComplianceReviewer(role: DemoRole) {
  if (role !== "Regional Officer" && role !== "Bureau Officer") throw new ComplianceMutationError("DEMO_POLICY_DENIED", `${role} cannot review demo compliance metadata.`);
}

function ensureApplicationExists(state: DemoBackendState, applicationId: string) {
  if (!state.applications.some((application) => application.id === applicationId)) throw new ComplianceMutationError("CONFLICT", "The compliance record is not linked to a current demo application.");
}

function createActivity(applicationId: string, recordId: string, recordType: DemoComplianceActivity["recordType"], action: string, actorRole: DemoRole, detail?: string): DemoComplianceActivity {
  return { action, actorRole, applicationId, detail: detail || undefined, id: `compliance-${randomUUID()}`, occurredAt: new Date().toISOString(), recordId, recordType };
}

function demoDate() {
  return "2026-10-26";
}
