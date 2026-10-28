import type { ApplicationStage, DemoApplication } from "@/features/dashboard/types";
import type { DemoRole } from "@/types/roles";

export const demoStages: ApplicationStage[] = ["Initial Scrutiny", "Re-Scrutiny", "Awaiting EVC", "EVC Completed", "SAC/SHC Review", "Compliance Review"];

const streamlinedStages: ApplicationStage[] = ["Initial Scrutiny", "Re-Scrutiny", "SAC/SHC Review", "Compliance Review"];

export function getWorkflowRoute(application: DemoApplication) {
  // Fictional route configuration: EVC-path applications keep the EVC stages;
  // others may use a shorter illustrative review route.
  if (["Awaiting EVC", "EVC Completed"].includes(application.stage)) return demoStages;
  if (application.region === "West" && !["EVC Completed"].includes(application.stage)) return streamlinedStages;
  return demoStages;
}

type RolePolicy = { forwardStages: ApplicationStage[]; returnStages: ApplicationStage[] };

export const demoRolePolicy: Record<DemoRole, RolePolicy> = {
  Institution: { forwardStages: [], returnStages: [] },
  "Regional Officer": { forwardStages: ["Initial Scrutiny", "Re-Scrutiny"], returnStages: ["Initial Scrutiny", "Re-Scrutiny"] },
  "Bureau Officer": { forwardStages: ["SAC/SHC Review", "Compliance Review"], returnStages: ["SAC/SHC Review", "Compliance Review"] },
  "EVC Member": { forwardStages: ["Awaiting EVC"], returnStages: ["Awaiting EVC"] },
  Administrator: { forwardStages: [], returnStages: [] },
};

export const demoEvcPolicy: Record<DemoRole, { canComplete: boolean; canSchedule: boolean }> = {
  Institution: { canComplete: false, canSchedule: false },
  "Regional Officer": { canComplete: false, canSchedule: true },
  "Bureau Officer": { canComplete: false, canSchedule: false },
  "EVC Member": { canComplete: true, canSchedule: false },
  Administrator: { canComplete: false, canSchedule: false },
};

export function isEvcEligible(application: DemoApplication) {
  return getWorkflowRoute(application).includes("Awaiting EVC");
}

export function getRoleActionMessage(role: DemoRole, stage: ApplicationStage) {
  const policy = demoRolePolicy[role];
  if (policy.forwardStages.includes(stage) || policy.returnStages.includes(stage)) return null;
  if (role === "Institution") return "Institution demo users can review their record but cannot perform officer workflow actions.";
  if (role === "Administrator") return "Administrators can inspect this demo configuration but do not bypass transition validation.";
  return `${role} is not assigned illustrative workflow actions for ${stage}.`;
}
