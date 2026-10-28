import { z } from "zod";
import { demoRoles } from "@/types/roles";
import { demoBackendSchemaVersion, type DemoBackendState } from "./types";

const applicationStages = ["Initial Scrutiny", "Re-Scrutiny", "Awaiting EVC", "EVC Completed", "SAC/SHC Review", "Compliance Review"] as const;
const applicationStatuses = ["Pending", "In Review", "Overdue", "Completed"] as const;
const workflowActions = ["Forward", "Return", "EVC Scheduled", "EVC Rescheduled", "EVC Completed"] as const;
const complianceStatuses = ["Pending Submission", "Submitted for Verification", "Verified", "Returned for Correction"] as const;
const documentStatuses = ["Current", "Expiring Soon", "Expired", "Renewal Submitted", "Renewal Verified", "Returned for Correction"] as const;

export const demoRoleSchema = z.enum(demoRoles);
export const applicationStageSchema = z.enum(applicationStages);
export const applicationIdSchema = z.string().regex(/^AP-\d{4}-\d{4}$/, "Use a valid demo application ID.");
export const undertakingIdSchema = z.string().regex(/^UND-\d{4}$/, "Use a valid demo undertaking ID.");
export const documentIdSchema = z.string().regex(/^DOC-\d{4}$/, "Use a valid demo document ID.");
export const requiredReasonSchema = z.string().trim().min(1, "A reason is required.").max(2_000, "Reason is too long.");
export const nonEmptyDemoTextSchema = z.string().trim().min(1, "This field is required.").max(2_000, "This field is too long.");

export const isoCalendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.").superRefine((value, context) => {
  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) {
    context.addIssue({ code: "custom", message: "Use a real calendar date." });
  }
});

const evcVisitSchema = z.object({
  committeeName: nonEmptyDemoTextSchema,
  completedAt: isoCalendarDateSchema.optional(),
  completionNote: z.string().trim().max(2_000).optional(),
  members: nonEmptyDemoTextSchema,
  note: z.string().trim().max(2_000).optional(),
  scheduledAt: isoCalendarDateSchema,
}).strict();

const applicationSchema = z.object({
  documentExpiryAt: isoCalendarDateSchema.optional(),
  evcSchedulingDueAt: isoCalendarDateSchema.optional(),
  evcVisit: evcVisitSchema.optional(),
  id: applicationIdSchema,
  institution: nonEmptyDemoTextSchema,
  lastUpdatedAt: isoCalendarDateSchema,
  region: z.enum(["North", "South", "East", "West", "Central"]),
  stage: z.enum(applicationStages),
  stageEnteredAt: isoCalendarDateSchema,
  status: z.enum(applicationStatuses),
  submittedAt: isoCalendarDateSchema,
  undertakingDueAt: isoCalendarDateSchema.optional(),
}).strict();

const workflowHistorySchema = z.object({
  action: z.enum(workflowActions),
  actorRole: demoRoleSchema,
  applicationId: applicationIdSchema,
  fromStage: z.enum(applicationStages),
  id: z.string().trim().min(1).max(200),
  occurredAt: z.string().datetime({ offset: true }),
  reason: z.string().trim().max(2_000).optional(),
  toStage: z.enum(applicationStages),
}).strict();

const undertakingSchema = z.object({
  applicationId: applicationIdSchema,
  dueAt: isoCalendarDateSchema,
  evidenceFileName: z.string().trim().min(1).max(255).optional(),
  id: undertakingIdSchema,
  note: z.string().trim().max(2_000).optional(),
  returnReason: z.string().trim().min(1).max(2_000).optional(),
  status: z.enum(complianceStatuses),
  submittedAt: isoCalendarDateSchema.optional(),
  title: nonEmptyDemoTextSchema,
}).strict();

const documentSchema = z.object({
  applicationId: applicationIdSchema,
  documentType: nonEmptyDemoTextSchema,
  expiresAt: isoCalendarDateSchema,
  id: documentIdSchema,
  issuedAt: isoCalendarDateSchema.optional(),
  name: nonEmptyDemoTextSchema,
  renewalFileName: z.string().trim().min(1).max(255).optional(),
  renewalNote: z.string().trim().max(2_000).optional(),
  renewalSubmittedAt: isoCalendarDateSchema.optional(),
  renewedExpiresAt: isoCalendarDateSchema.optional(),
  returnReason: z.string().trim().min(1).max(2_000).optional(),
  status: z.enum(documentStatuses),
}).strict();

const complianceActivitySchema = z.object({
  action: nonEmptyDemoTextSchema,
  actorRole: demoRoleSchema,
  applicationId: applicationIdSchema,
  detail: z.string().trim().max(2_000).optional(),
  id: z.string().trim().min(1).max(200),
  occurredAt: z.string().datetime({ offset: true }),
  recordId: z.union([undertakingIdSchema, documentIdSchema]),
  recordType: z.enum(["Undertaking", "Document"]),
}).strict();

export const demoBackendStateSchema = z.object({
  applications: z.array(applicationSchema),
  complianceActivity: z.array(complianceActivitySchema),
  documents: z.array(documentSchema),
  readAlertKeys: z.array(z.string().trim().min(1).max(250)),
  revision: z.number().int().nonnegative(),
  schemaVersion: z.literal(demoBackendSchemaVersion),
  undertakings: z.array(undertakingSchema),
  updatedAt: z.string().datetime({ offset: true }),
  workflowHistory: z.array(workflowHistorySchema),
}).strict();

export function parseDemoBackendState(value: unknown): DemoBackendState {
  return demoBackendStateSchema.parse(value) as DemoBackendState;
}

export type RequestPayloadResult<T> =
  | { data: T; success: true }
  | { issues: z.ZodIssue[]; success: false };

export async function parseRequestPayload<T>(request: Request, schema: z.ZodType<T>): Promise<RequestPayloadResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { issues: [{ code: "custom", message: "Request body must be valid JSON.", path: [] }], success: false };
  }
  const parsed = schema.safeParse(body);
  return parsed.success ? { data: parsed.data, success: true } : { issues: parsed.error.issues, success: false };
}

export function parseSearchParams<T>(url: string, schema: z.ZodType<T>): RequestPayloadResult<T> {
  const parameters = new URL(url).searchParams;
  const parsed = schema.safeParse(Object.fromEntries(parameters.entries()));
  return parsed.success ? { data: parsed.data, success: true } : { issues: parsed.error.issues, success: false };
}
