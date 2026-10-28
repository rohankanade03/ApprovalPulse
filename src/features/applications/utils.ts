import { demoApplications } from "@/features/dashboard/data/demo-applications";
import { daysBetween, isOpen, isOverdue } from "@/features/dashboard/utils";
import type { ApplicationStage, ApplicationStatus, DemoApplication, Region } from "@/features/dashboard/types";

export type ApplicationFilters = {
  query: string;
  region: Region | "All Regions";
  stage: ApplicationStage | "All Stages";
  status: ApplicationStatus | "All Statuses";
};

export const defaultApplicationFilters: ApplicationFilters = {
  query: "",
  region: "All Regions",
  stage: "All Stages",
  status: "All Statuses",
};

export const applicationStages = Array.from(new Set(demoApplications.map((application) => application.stage)));
export const applicationStatuses = Array.from(new Set(demoApplications.map((application) => application.status)));

export function getApplicationById(id: string) {
  return demoApplications.find((application) => application.id === id);
}

export function getRegistryMetrics(applications: DemoApplication[]) {
  return {
    total: applications.length,
    pending: applications.filter((application) => isOpen(application) && !isOverdue(application)).length,
    overdue: applications.filter(isOverdue).length,
    completed: applications.filter((application) => application.status === "Completed").length,
  };
}

export function filterApplications(applications: DemoApplication[], filters: ApplicationFilters) {
  const query = filters.query.trim().toLowerCase();
  return applications.filter((application) => {
    const matchesQuery = !query || application.id.toLowerCase().includes(query) || application.institution.toLowerCase().includes(query);
    const matchesRegion = filters.region === "All Regions" || application.region === filters.region;
    const matchesStage = filters.stage === "All Stages" || application.stage === filters.stage;
    const matchesStatus = filters.status === "All Statuses" || application.status === filters.status;
    return matchesQuery && matchesRegion && matchesStage && matchesStatus;
  });
}

export function getStageAgeing(application: DemoApplication) {
  const days = daysBetween(application.stageEnteredAt);
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function getRecordMilestones(application: DemoApplication) {
  return [
    { label: "Application submitted", date: application.submittedAt, description: "Fictional application record created for this demo." },
    { label: `${application.stage} entered`, date: application.stageEnteredAt, description: "Current stage entry date from the local demo record." },
    { label: "Record last updated", date: application.lastUpdatedAt, description: "Latest available update field; this is not a live audit event." },
  ].sort((first, second) => first.date.localeCompare(second.date));
}
