import "server-only";

import type { ApplicationStage, ApplicationStatus, DemoApplication, Region, TimeRange } from "@/features/dashboard/types";
import type { DemoBackendState } from "../types";
import { getAlerts } from "./alerts";
import { getComplianceSummary, getDocuments, getUndertakings } from "./compliance";
import { demoDaysSince, getServerDocumentStatus, isDemoWorkflowOverdue, isOpenApplication } from "./shared";

const stages: ApplicationStage[] = ["Initial Scrutiny", "Re-Scrutiny", "Awaiting EVC", "SAC/SHC Review", "Compliance Review"];
const regions: Region[] = ["North", "South", "East", "West", "Central"];

export type ReportFilters = { range?: TimeRange; region?: Region; search?: string; stage?: ApplicationStage; status?: ApplicationStatus };

export function filterApplications(applications: DemoApplication[], filters: ReportFilters = {}) {
  const cutoff = filters.range === "7d" ? "2026-10-20" : filters.range === "quarter" ? "2026-07-01" : "2026-09-26";
  const query = filters.search?.trim().toLowerCase();
  return applications.filter((application) => application.lastUpdatedAt >= cutoff
    && (!filters.region || application.region === filters.region)
    && (!filters.stage || application.stage === filters.stage)
    && (!filters.status || application.status === filters.status)
    && (!query || `${application.id} ${application.institution}`.toLowerCase().includes(query)));
}

export function getDashboardSummary(state: DemoBackendState, filters: Pick<ReportFilters, "region" | "range"> = {}) {
  // Dashboard KPIs mirror the existing UI: region scopes KPIs while time range scopes the regional comparison.
  const applications = filters.region ? state.applications.filter((application) => application.region === filters.region) : state.applications;
  const cutoff = filters.range === "7d" ? "2026-10-20" : filters.range === "quarter" ? "2026-07-01" : "2026-09-26";
  const regionalSource = state.applications.filter((application) => application.lastUpdatedAt >= cutoff);
  const ids = new Set(applications.map((application) => application.id));
  const undertakings = state.undertakings.filter((record) => ids.has(record.applicationId));
  const documents = state.documents.filter((record) => ids.has(record.applicationId));
  return {
    ageing: ["0–3 days", "4–7 days", "8–15 days", "More than 15 days"].map((label) => ({ label, count: applications.filter((application) => {
      if (!isOpenApplication(application)) return false; const days = demoDaysSince(application.stageEnteredAt);
      return label === "0–3 days" ? days <= 3 : label === "4–7 days" ? days >= 4 && days <= 7 : label === "8–15 days" ? days >= 8 && days <= 15 : days > 15;
    }).length })),
    metrics: {
      awaitingEvc: applications.filter((application) => isOpenApplication(application) && application.stage === "Awaiting EVC" && !application.evcVisit?.completedAt).length,
      complianceDueSoon: undertakings.filter((record) => record.status !== "Verified" && demoDaysSince(record.dueAt) >= -7 && demoDaysSince(record.dueAt) <= 0).length,
      expiredDocuments: documents.filter((record) => getServerDocumentStatus(record) === "Expired").length,
      overdue: applications.filter(isDemoWorkflowOverdue).length,
      pending: applications.filter(isOpenApplication).length,
      total: applications.length,
    },
    regional: regions.filter((region) => !filters.region || filters.region === region).map((region) => { const scoped = regionalSource.filter((application) => application.region === region); return { region, pending: scoped.filter(isOpenApplication).length, overdue: scoped.filter(isDemoWorkflowOverdue).length }; }),
    stagePendency: stages.map((stage) => ({ stage, count: applications.filter((application) => isOpenApplication(application) && application.stage === stage).length })),
  };
}

export function getReport(state: DemoBackendState, filters: ReportFilters = {}) {
  const applications = filterApplications(state.applications, filters);
  const ids = new Set(applications.map((application) => application.id));
  const scopedState: DemoBackendState = { ...state, applications, documents: state.documents.filter((item) => ids.has(item.applicationId)), undertakings: state.undertakings.filter((item) => ids.has(item.applicationId)) };
  const undertakings = getUndertakings(scopedState);
  const documents = getDocuments(scopedState);
  return {
    alerts: getAlerts(scopedState),
    applications: applications.map((application) => ({ application, documentIndicators: documents.filter((item) => item.document.applicationId === application.id).map((item) => item.derivedStatus), undertakingIndicators: undertakings.filter((item) => item.undertaking.applicationId === application.id).map((item) => item.undertaking.status) })),
    compliance: getComplianceSummary(scopedState),
    dashboard: getDashboardSummary(state, filters),
    filters,
  };
}

export function toReportCsv(report: ReturnType<typeof getReport>) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = [["ApprovalPulse DEMO DATA report"], ["Application ID", "Institution", "Region", "Current Stage", "Status", "Undertaking indicators", "Document indicators"]];
  report.applications.forEach(({ application, undertakingIndicators, documentIndicators }) => rows.push([application.id, application.institution, application.region, application.stage, application.status, undertakingIndicators.join("; ") || "—", documentIndicators.join("; ") || "—"]));
  return rows.map((row) => row.map(escape).join(",")).join("\n");
}
