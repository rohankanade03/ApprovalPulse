import type { DemoApplication, EvcVisitStatus } from "@/features/dashboard/types";
import { isEvcEligible } from "@/features/workflow/config";

const demoReferenceDate = new Date("2026-10-26T10:30:00+05:30");

export function getEvcStatus(application: DemoApplication): EvcVisitStatus | null {
  if (!isEvcEligible(application)) return null;
  if (!application.evcVisit) return "Unscheduled";
  if (application.evcVisit.completedAt) return "Completed";
  const scheduled = new Date(`${application.evcVisit.scheduledAt}T00:00:00+05:30`);
  const today = new Date(demoReferenceDate);
  today.setHours(0, 0, 0, 0);
  return scheduled < today ? "Overdue" : "Scheduled";
}

export function getEvcApplications(applications: DemoApplication[]) {
  return applications.filter(isEvcEligible);
}
