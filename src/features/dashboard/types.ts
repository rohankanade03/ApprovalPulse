export const regions = ["North", "South", "East", "West", "Central"] as const;
export type Region = (typeof regions)[number];

export const timeRanges = ["7d", "30d", "quarter"] as const;
export type TimeRange = (typeof timeRanges)[number];

export type ApplicationStage =
  | "Initial Scrutiny"
  | "Re-Scrutiny"
  | "Awaiting EVC"
  | "EVC Completed"
  | "SAC/SHC Review"
  | "Compliance Review";

export type ApplicationStatus = "Pending" | "In Review" | "Overdue" | "Completed";
export type Severity = "High" | "Medium" | "Low";

export type DemoApplication = {
  id: string;
  institution: string;
  region: Region;
  stage: ApplicationStage;
  status: ApplicationStatus;
  submittedAt: string;
  stageEnteredAt: string;
  lastUpdatedAt: string;
  undertakingDueAt?: string;
  documentExpiryAt?: string;
  evcSchedulingDueAt?: string;
  evcVisit?: DemoEvcVisit;
};

export type EvcVisitStatus = "Unscheduled" | "Scheduled" | "Completed" | "Overdue";

export type DemoEvcVisit = {
  committeeName: string;
  completedAt?: string;
  completionNote?: string;
  members: string;
  note?: string;
  scheduledAt: string;
};

export type AttentionItem = {
  applicationId: string;
  detail: string;
  dueLabel: string;
  href: string;
  institution: string;
  issueType: string;
  severity: Severity | "Critical";
};

export type WorkflowAction = "Forward" | "Return" | "EVC Scheduled" | "EVC Rescheduled" | "EVC Completed";
export type ComplianceStatus = "Pending Submission" | "Submitted for Verification" | "Verified" | "Returned for Correction";
export type DocumentStatus = "Current" | "Expiring Soon" | "Expired" | "Renewal Submitted" | "Renewal Verified" | "Returned for Correction";

export type DemoUndertaking = { id: string; applicationId: string; title: string; dueAt: string; status: ComplianceStatus; submittedAt?: string; evidenceFileName?: string; note?: string; returnReason?: string };
export type DemoDocument = { id: string; applicationId: string; name: string; documentType: string; issuedAt?: string; expiresAt: string; status: DocumentStatus; renewalFileName?: string; renewalSubmittedAt?: string; renewalNote?: string; returnReason?: string; renewedExpiresAt?: string };
export type DemoComplianceActivity = { id: string; applicationId: string; recordId: string; recordType: "Undertaking" | "Document"; action: string; actorRole: string; occurredAt: string; detail?: string };
export type DemoAlertSeverity = "Critical" | "High" | "Medium" | "Low";
export type DemoAlertCategory = "Workflow" | "EVC" | "Undertaking" | "Document Expiry";
export type DemoAlert = { key: string; applicationId: string; institution: string; title: string; message: string; category: DemoAlertCategory; severity: DemoAlertSeverity; dueAt?: string; href: string; overdueDays?: number };

export type DemoWorkflowHistoryEntry = {
  action: WorkflowAction;
  actorRole: string;
  applicationId: string;
  fromStage: ApplicationStage;
  id: string;
  occurredAt: string;
  reason?: string;
  toStage: ApplicationStage;
};
