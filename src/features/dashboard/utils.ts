import type { ApplicationStage, AttentionItem, DemoApplication, DemoDocument, DemoUndertaking, Region, TimeRange } from "./types";
import { getDocumentStatus } from "@/features/compliance/utils";

export const demoReferenceDate = new Date("2026-10-26T10:30:00+05:30");
export const demoConfiguration = {
  complianceWindowDays: 7,
  documentWarningDays: 30,
  overdueStageDays: 15,
};

const dateValue = (value: string) => new Date(`${value}T00:00:00+05:30`);

export function daysBetween(start: string, end = demoReferenceDate) {
  return Math.floor((end.getTime() - dateValue(start).getTime()) / 86_400_000);
}

export function formatDemoDate(value: string) {
  if (!value || Number.isNaN(dateValue(value).getTime())) return "—";
  return dateValue(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function isOpen(application: DemoApplication) {
  return application.status !== "Completed";
}

export function isOverdue(application: DemoApplication) {
  return isOpen(application) && daysBetween(application.stageEnteredAt) > demoConfiguration.overdueStageDays;
}

export function filterByRegion(applications: DemoApplication[], region: Region | "All Regions") {
  return region === "All Regions" ? applications : applications.filter((application) => application.region === region);
}

export function cutoffForTimeRange(range: TimeRange) {
  if (range === "7d") return "2026-10-20";
  if (range === "30d") return "2026-09-26";
  return "2026-07-01";
}

export function filterByTimeRange(applications: DemoApplication[], range: TimeRange) {
  const cutoff = cutoffForTimeRange(range);
  return applications.filter((application) => application.lastUpdatedAt >= cutoff);
}

export function getDashboardMetrics(applications: DemoApplication[], undertakings: DemoUndertaking[] = [], documents: DemoDocument[] = []) {
  const scopedUndertakings = undertakings.filter((item) => applications.some((application) => application.id === item.applicationId));
  const scopedDocuments = documents.filter((item) => applications.some((application) => application.id === item.applicationId));
  const dueSoon = scopedUndertakings.length ? scopedUndertakings.filter((item) => item.status !== "Verified" && daysBetween(item.dueAt) >= -demoConfiguration.complianceWindowDays && daysBetween(item.dueAt) <= 0).length : applications.filter((application) => application.undertakingDueAt && daysBetween(application.undertakingDueAt) >= -demoConfiguration.complianceWindowDays && daysBetween(application.undertakingDueAt) <= 0).length;

  return {
    total: applications.length,
    pending: applications.filter(isOpen).length,
    overdue: applications.filter(isOverdue).length,
    awaitingEvc: applications.filter((application) => isOpen(application) && application.stage === "Awaiting EVC" && !application.evcVisit?.completedAt).length,
    complianceDueSoon: dueSoon,
    expiredDocuments: scopedDocuments.length ? scopedDocuments.filter((item) => getDocumentStatus(item) === "Expired").length : applications.filter((application) => application.documentExpiryAt && daysBetween(application.documentExpiryAt) > 0).length,
  };
}

const pendingStages: ApplicationStage[] = ["Initial Scrutiny", "Re-Scrutiny", "Awaiting EVC", "SAC/SHC Review", "Compliance Review"];

export function getStagePendency(applications: DemoApplication[]) {
  return pendingStages.map((stage) => ({
    stage,
    count: applications.filter((application) => isOpen(application) && application.stage === stage).length,
  }));
}

export function getRegionalOverview(sourceApplications: DemoApplication[], region: Region | "All Regions", range: TimeRange) {
  const source = filterByTimeRange(sourceApplications, range);
  const labels: Region[] = region === "All Regions" ? ["North", "South", "East", "West", "Central"] : [region];
  return labels.map((label) => {
    const applications = source.filter((application) => application.region === label);
    return {
      region: label,
      pending: applications.filter(isOpen).length,
      overdue: applications.filter(isOverdue).length,
    };
  });
}

export function getAgeingBuckets(applications: DemoApplication[]) {
  const openApplications = applications.filter(isOpen);
  const buckets = [
    { label: "0–3 days", tone: "green" },
    { label: "4–7 days", tone: "blue" },
    { label: "8–15 days", tone: "amber" },
    { label: "More than 15 days", tone: "red" },
  ] as const;

  return buckets.map((bucket) => ({
    ...bucket,
    count: openApplications.filter((application) => {
      const days = daysBetween(application.stageEnteredAt);
      if (bucket.label === "0–3 days") return days <= 3;
      if (bucket.label === "4–7 days") return days >= 4 && days <= 7;
      if (bucket.label === "8–15 days") return days >= 8 && days <= 15;
      return days > 15;
    }).length,
  }));
}

export function getAttentionItems(applications: DemoApplication[]) {
  const items: AttentionItem[] = [];

  applications.forEach((application) => {
    if (isOverdue(application)) {
      const daysOverdue = daysBetween(application.stageEnteredAt) - demoConfiguration.overdueStageDays;
      items.push({ applicationId: application.id, institution: application.institution, issueType: "Stage pendency", detail: `${application.stage} exceeds the configured demo threshold.`, dueLabel: `${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`, severity: "High", href: "/workflow" });
    }
    if (application.evcSchedulingDueAt && !application.evcVisit) {
      const days = daysBetween(application.evcSchedulingDueAt);
      if (days >= -demoConfiguration.complianceWindowDays && days <= 0) {
        items.push({ applicationId: application.id, institution: application.institution, issueType: "EVC scheduling", detail: "EVC scheduling due within the demo attention window.", dueLabel: `Due ${formatDemoDate(application.evcSchedulingDueAt)}`, severity: "Medium", href: "/evc" });
      }
    }
    if (application.undertakingDueAt) {
      const days = daysBetween(application.undertakingDueAt);
      if (days >= -demoConfiguration.complianceWindowDays && days <= 0) {
        items.push({ applicationId: application.id, institution: application.institution, issueType: "Undertaking due", detail: "Undertaking is due within the configured demo window.", dueLabel: days > 0 ? `${days} day${days === 1 ? "" : "s"} overdue` : `Due ${formatDemoDate(application.undertakingDueAt)}`, severity: days > 0 ? "High" : "Medium", href: "/undertakings" });
      }
    }
    if (application.documentExpiryAt) {
      const days = daysBetween(application.documentExpiryAt);
      if (days > 0) {
        items.push({ applicationId: application.id, institution: application.institution, issueType: "Expired document", detail: "Renewed document submission is awaiting follow-up.", dueLabel: `Expired ${days} day${days === 1 ? "" : "s"} ago`, severity: "High", href: "/documents" });
      } else if (days >= -demoConfiguration.documentWarningDays) {
        items.push({ applicationId: application.id, institution: application.institution, issueType: "Document validity", detail: "A document is approaching expiry in the demo warning window.", dueLabel: `Expires ${formatDemoDate(application.documentExpiryAt)}`, severity: "Low", href: "/documents" });
      }
    }
  });

  const rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return items.sort((first, second) => rank[first.severity] - rank[second.severity]).slice(0, 6);
}
