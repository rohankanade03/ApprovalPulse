import "server-only";

import type { DemoAlert } from "@/features/dashboard/types";
import { alertDemoConfiguration } from "@/features/notifications/config";
import type { DemoBackendState, DemoStateRepository } from "../types";
import { demoDaysSince, getServerDocumentStatus, getServerEvcStatus, getServerUndertakingTiming, isDemoWorkflowOverdue } from "./shared";

const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 } as const;

export class AlertReadMutationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlertReadMutationError";
  }
}

export async function setAlertRead(repository: DemoStateRepository, key: string, read: boolean) {
  const state = await repository.update((current) => {
    if (!getAlerts(current).some((alert) => alert.key === key)) throw new AlertReadMutationError("The requested active demo alert was not found.");
    current.readAlertKeys = read ? Array.from(new Set([...current.readAlertKeys, key])) : current.readAlertKeys.filter((item) => item !== key);
    return current;
  });
  return { readAlertKeys: state.readAlertKeys, revision: state.revision, updatedAt: state.updatedAt };
}

export function getAlerts(state: DemoBackendState): Array<DemoAlert & { read: boolean }> {
  const applications = new Map(state.applications.map((application) => [application.id, application]));
  const alerts: DemoAlert[] = [];
  state.applications.forEach((application) => {
    if (isDemoWorkflowOverdue(application)) {
      const overdueDays = demoDaysSince(application.stageEnteredAt) - 15;
      alerts.push({ key: `workflow-${application.id}-overdue`, applicationId: application.id, institution: application.institution, title: "Workflow stage overdue", message: `${application.stage} exceeds the illustrative stage-ageing threshold.`, category: "Workflow", severity: overdueDays > alertDemoConfiguration.escalationAfterOverdueDays ? "Critical" : "High", dueAt: application.stageEnteredAt, href: `/workflow/${application.id}`, overdueDays });
    }
    const evcStatus = getServerEvcStatus(application);
    if (evcStatus === "Overdue" && application.evcVisit) alerts.push({ key: `evc-${application.id}-overdue`, applicationId: application.id, institution: application.institution, title: "EVC visit overdue", message: "A scheduled illustrative EVC visit has not been completed.", category: "EVC", severity: "High", dueAt: application.evcVisit.scheduledAt, href: "/evc", overdueDays: demoDaysSince(application.evcVisit.scheduledAt) });
    if (application.evcSchedulingDueAt && !application.evcVisit) {
      const daysUntil = -demoDaysSince(application.evcSchedulingDueAt);
      if (daysUntil >= 0 && daysUntil <= alertDemoConfiguration.undertakingDueSoonDays) alerts.push({ key: `evc-${application.id}-upcoming`, applicationId: application.id, institution: application.institution, title: "EVC scheduling deadline approaching", message: "EVC scheduling is due within the illustrative attention window.", category: "EVC", severity: "Medium", dueAt: application.evcSchedulingDueAt, href: "/evc" });
    }
  });
  state.undertakings.forEach((undertaking) => {
    const application = applications.get(undertaking.applicationId); if (!application) return;
    const timing = getServerUndertakingTiming(undertaking);
    if (timing.overdue) alerts.push({ key: `undertaking-${undertaking.id}-overdue`, applicationId: application.id, institution: application.institution, title: "Undertaking overdue", message: `${undertaking.title} remains unresolved after its fictional due date.`, category: "Undertaking", severity: "High", dueAt: undertaking.dueAt, href: "/undertakings", overdueDays: demoDaysSince(undertaking.dueAt) });
    else if (timing.dueSoon) alerts.push({ key: `undertaking-${undertaking.id}-due`, applicationId: application.id, institution: application.institution, title: "Undertaking due soon", message: `${undertaking.title} is due within the illustrative seven-day window.`, category: "Undertaking", severity: "Medium", dueAt: undertaking.dueAt, href: "/undertakings" });
    if (undertaking.status === "Submitted for Verification") alerts.push({ key: `undertaking-${undertaking.id}-review`, applicationId: application.id, institution: application.institution, title: "Undertaking awaiting verification", message: "Submitted demo evidence is awaiting reviewer action.", category: "Undertaking", severity: "Low", href: "/undertakings" });
  });
  state.documents.forEach((document) => {
    const application = applications.get(document.applicationId); if (!application) return;
    const status = getServerDocumentStatus(document);
    if (status === "Expired") alerts.push({ key: `document-${document.id}-expired`, applicationId: application.id, institution: application.institution, title: "Document expired", message: `${document.documentType} has passed its fictional validity date.`, category: "Document Expiry", severity: "Critical", dueAt: document.expiresAt, href: "/documents", overdueDays: demoDaysSince(document.expiresAt) });
    else if (status === "Expiring Soon") alerts.push({ key: `document-${document.id}-expiring`, applicationId: application.id, institution: application.institution, title: "Document expiring soon", message: `${document.documentType} expires within the illustrative warning window.`, category: "Document Expiry", severity: "Medium", dueAt: document.expiresAt, href: "/documents" });
    else if (status === "Renewal Submitted") alerts.push({ key: `document-${document.id}-review`, applicationId: application.id, institution: application.institution, title: "Renewal awaiting verification", message: "Renewal metadata is submitted but not yet verified.", category: "Document Expiry", severity: "Low", href: "/documents" });
  });
  return alerts.sort((first, second) => severityOrder[first.severity] - severityOrder[second.severity]).map((alert) => ({ ...alert, read: state.readAlertKeys.includes(alert.key) }));
}
