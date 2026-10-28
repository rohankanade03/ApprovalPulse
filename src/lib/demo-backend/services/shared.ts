import "server-only";

import type { DemoApplication, DemoDocument, DemoUndertaking, DocumentStatus, EvcVisitStatus } from "@/features/dashboard/types";
import { demoReferenceDate } from "@/features/dashboard/utils";
import { complianceDemoSettings } from "@/features/compliance/utils";
import { demoConfiguration } from "@/features/dashboard/utils";
import { isEvcEligible } from "@/features/workflow/config";

export const serverDemoReferenceDate = new Date(demoReferenceDate);
const millisecondsPerDay = 86_400_000;

function parseCalendarDate(value: string) {
  return new Date(`${value}T00:00:00+05:30`);
}

export function demoDaysSince(value: string) {
  return Math.floor((serverDemoReferenceDate.getTime() - parseCalendarDate(value).getTime()) / millisecondsPerDay);
}

export function demoDaysUntil(value: string) {
  return -demoDaysSince(value);
}

export function isOpenApplication(application: DemoApplication) {
  return application.status !== "Completed";
}

export function isDemoWorkflowOverdue(application: DemoApplication) {
  return isOpenApplication(application) && demoDaysSince(application.stageEnteredAt) > demoConfiguration.overdueStageDays;
}

export function getServerEvcStatus(application: DemoApplication): EvcVisitStatus | null {
  if (!isEvcEligible(application)) return null;
  if (!application.evcVisit) return "Unscheduled";
  if (application.evcVisit.completedAt) return "Completed";
  return demoDaysSince(application.evcVisit.scheduledAt) > 0 ? "Overdue" : "Scheduled";
}

export function getServerUndertakingTiming(record: DemoUndertaking) {
  const daysUntil = demoDaysUntil(record.dueAt);
  return {
    dueSoon: record.status !== "Verified" && daysUntil >= 0 && daysUntil <= complianceDemoSettings.dueSoonDays,
    overdue: record.status !== "Verified" && daysUntil < 0,
  };
}

export function getServerDocumentStatus(record: DemoDocument): DocumentStatus {
  if (["Renewal Submitted", "Renewal Verified", "Returned for Correction"].includes(record.status)) return record.status;
  const daysUntil = demoDaysUntil(record.expiresAt);
  return daysUntil < 0 ? "Expired" : daysUntil <= complianceDemoSettings.expirySoonDays ? "Expiring Soon" : "Current";
}

export function isKnownRegion(value: string | undefined): value is DemoApplication["region"] {
  return value === "North" || value === "South" || value === "East" || value === "West" || value === "Central";
}
