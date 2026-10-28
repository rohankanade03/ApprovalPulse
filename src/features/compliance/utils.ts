import type { DemoDocument, DemoUndertaking, DocumentStatus } from "@/features/dashboard/types";

export const complianceDemoSettings = { dueSoonDays: 7, expirySoonDays: 30 };
const demoReferenceDate = new Date("2026-10-26T10:30:00+05:30");

export function getUndertakingStatus(record: DemoUndertaking) { return record.status; }
export function getUndertakingTiming(record: DemoUndertaking) {
  const date = new Date(`${record.dueAt}T00:00:00+05:30`); const today = new Date(demoReferenceDate); today.setHours(0, 0, 0, 0);
  const days = Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
  return { dueSoon: record.status !== "Verified" && days >= 0 && days <= complianceDemoSettings.dueSoonDays, overdue: record.status !== "Verified" && days < 0 };
}
export function getDocumentStatus(record: DemoDocument): DocumentStatus {
  if (["Renewal Submitted", "Renewal Verified", "Returned for Correction"].includes(record.status)) return record.status;
  const date = new Date(`${record.expiresAt}T00:00:00+05:30`); const today = new Date(demoReferenceDate); today.setHours(0, 0, 0, 0);
  const days = Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
  return days < 0 ? "Expired" : days <= complianceDemoSettings.expirySoonDays ? "Expiring Soon" : "Current";
}
