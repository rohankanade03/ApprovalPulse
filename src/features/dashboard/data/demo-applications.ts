import type { DemoApplication } from "../types";

/**
 * Entirely fictional records, anchored to a fixed demo date in utils.ts.
 * They are intentionally local so a future data adapter can replace this module.
 */
export const demoApplications: DemoApplication[] = [
  { id: "AP-2026-1042", institution: "Saraswati Institute of Technology", region: "North", stage: "Initial Scrutiny", status: "Pending", submittedAt: "2026-10-17", stageEnteredAt: "2026-10-23", lastUpdatedAt: "2026-10-25", undertakingDueAt: "2026-10-30" },
  { id: "AP-2026-1038", institution: "Horizon College of Engineering", region: "North", stage: "Re-Scrutiny", status: "Overdue", submittedAt: "2026-09-18", stageEnteredAt: "2026-10-04", lastUpdatedAt: "2026-10-19", documentExpiryAt: "2026-10-20" },
  { id: "AP-2026-1029", institution: "Northgate Polytechnic", region: "North", stage: "Awaiting EVC", status: "Pending", submittedAt: "2026-10-03", stageEnteredAt: "2026-10-18", lastUpdatedAt: "2026-10-24", evcSchedulingDueAt: "2026-10-29" },
  { id: "AP-2026-1017", institution: "Pioneer School of Architecture", region: "North", stage: "SAC/SHC Review", status: "In Review", submittedAt: "2026-09-28", stageEnteredAt: "2026-10-16", lastUpdatedAt: "2026-10-21" },
  { id: "AP-2026-1005", institution: "Meridian Technical University", region: "North", stage: "EVC Completed", status: "Completed", submittedAt: "2026-08-10", stageEnteredAt: "2026-10-12", lastUpdatedAt: "2026-10-15" },

  { id: "AP-2026-1051", institution: "Coastal Institute of Management", region: "South", stage: "Initial Scrutiny", status: "Pending", submittedAt: "2026-10-21", stageEnteredAt: "2026-10-24", lastUpdatedAt: "2026-10-26", undertakingDueAt: "2026-11-01" },
  { id: "AP-2026-1046", institution: "Deccan College of Pharmacy", region: "South", stage: "Compliance Review", status: "Overdue", submittedAt: "2026-09-06", stageEnteredAt: "2026-10-05", lastUpdatedAt: "2026-10-22", undertakingDueAt: "2026-10-24" },
  { id: "AP-2026-1031", institution: "Kaveri Institute of Science", region: "South", stage: "Awaiting EVC", status: "In Review", submittedAt: "2026-10-08", stageEnteredAt: "2026-10-20", lastUpdatedAt: "2026-10-25", evcSchedulingDueAt: "2026-10-31" },
  { id: "AP-2026-1011", institution: "Southern Heights University", region: "South", stage: "SAC/SHC Review", status: "Pending", submittedAt: "2026-09-22", stageEnteredAt: "2026-10-15", lastUpdatedAt: "2026-10-18", documentExpiryAt: "2026-11-12" },

  { id: "AP-2026-1049", institution: "Eastern Valley Institute", region: "East", stage: "Re-Scrutiny", status: "Overdue", submittedAt: "2026-09-13", stageEnteredAt: "2026-10-02", lastUpdatedAt: "2026-10-20", documentExpiryAt: "2026-10-18" },
  { id: "AP-2026-1036", institution: "Bengal School of Technology", region: "East", stage: "Awaiting EVC", status: "Pending", submittedAt: "2026-10-05", stageEnteredAt: "2026-10-19", lastUpdatedAt: "2026-10-23", evcSchedulingDueAt: "2026-10-28" },
  { id: "AP-2026-1020", institution: "Riverfront College", region: "East", stage: "Compliance Review", status: "In Review", submittedAt: "2026-09-26", stageEnteredAt: "2026-10-17", lastUpdatedAt: "2026-10-25", undertakingDueAt: "2026-10-27" },

  { id: "AP-2026-1054", institution: "Western Institute of Design", region: "West", stage: "Initial Scrutiny", status: "Pending", submittedAt: "2026-10-22", stageEnteredAt: "2026-10-25", lastUpdatedAt: "2026-10-26" },
  { id: "AP-2026-1040", institution: "Sahyadri Engineering College", region: "West", stage: "SAC/SHC Review", status: "Overdue", submittedAt: "2026-09-12", stageEnteredAt: "2026-10-01", lastUpdatedAt: "2026-10-16", documentExpiryAt: "2026-10-25" },
  { id: "AP-2026-1025", institution: "Konkan Institute of Technology", region: "West", stage: "EVC Completed", status: "Completed", submittedAt: "2026-08-14", stageEnteredAt: "2026-10-13", lastUpdatedAt: "2026-10-14" },

  { id: "AP-2026-1050", institution: "Central Institute of Applied Sciences", region: "Central", stage: "Compliance Review", status: "Overdue", submittedAt: "2026-09-02", stageEnteredAt: "2026-09-30", lastUpdatedAt: "2026-10-21", undertakingDueAt: "2026-10-22" },
  { id: "AP-2026-1044", institution: "Vindhya College of Engineering", region: "Central", stage: "Awaiting EVC", status: "Pending", submittedAt: "2026-10-04", stageEnteredAt: "2026-10-18", lastUpdatedAt: "2026-10-24", evcSchedulingDueAt: "2026-11-02" },
  { id: "AP-2026-1022", institution: "Narmada School of Management", region: "Central", stage: "Re-Scrutiny", status: "In Review", submittedAt: "2026-09-25", stageEnteredAt: "2026-10-14", lastUpdatedAt: "2026-10-17", documentExpiryAt: "2026-11-04" },
];
