import "server-only";

import type { ApplicationStage, ApplicationStatus, DemoApplication } from "@/features/dashboard/types";
import type { DemoBackendState } from "../types";

export type ApplicationFilters = {
  region?: DemoApplication["region"];
  search?: string;
  stage?: ApplicationStage;
  status?: ApplicationStatus;
};

export function listApplications(state: DemoBackendState, filters: ApplicationFilters = {}) {
  const query = filters.search?.trim().toLowerCase();
  return state.applications.filter((application) =>
    (!filters.region || application.region === filters.region)
    && (!filters.stage || application.stage === filters.stage)
    && (!filters.status || application.status === filters.status)
    && (!query || `${application.id} ${application.institution}`.toLowerCase().includes(query)),
  );
}

export function getApplication(state: DemoBackendState, applicationId: string) {
  return state.applications.find((application) => application.id === applicationId);
}

export function getApplicationDetail(state: DemoBackendState, applicationId: string) {
  const application = getApplication(state, applicationId);
  if (!application) return undefined;
  return {
    application,
    complianceActivity: state.complianceActivity.filter((item) => item.applicationId === applicationId),
    documents: state.documents.filter((item) => item.applicationId === applicationId),
    undertakings: state.undertakings.filter((item) => item.applicationId === applicationId),
    workflowHistory: state.workflowHistory.filter((item) => item.applicationId === applicationId).sort((first, second) => second.occurredAt.localeCompare(first.occurredAt)),
  };
}
