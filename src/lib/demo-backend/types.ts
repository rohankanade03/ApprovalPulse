import type {
  DemoApplication,
  DemoComplianceActivity,
  DemoDocument,
  DemoUndertaking,
  DemoWorkflowHistoryEntry,
} from "@/features/dashboard/types";

export const demoBackendSchemaVersion = 1 as const;

export type DemoBackendState = {
  applications: DemoApplication[];
  complianceActivity: DemoComplianceActivity[];
  documents: DemoDocument[];
  readAlertKeys: string[];
  revision: number;
  schemaVersion: typeof demoBackendSchemaVersion;
  undertakings: DemoUndertaking[];
  updatedAt: string;
  workflowHistory: DemoWorkflowHistoryEntry[];
};

export type DemoStateMutation = (state: DemoBackendState) => DemoBackendState | Promise<DemoBackendState>;

export interface DemoStateRepository {
  read(): Promise<DemoBackendState>;
  reset(): Promise<DemoBackendState>;
  update(mutation: DemoStateMutation): Promise<DemoBackendState>;
}
