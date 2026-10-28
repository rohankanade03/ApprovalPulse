import { demoDocuments, demoUndertakings } from "@/features/compliance/data/demo-compliance";
import { demoApplications } from "@/features/dashboard/data/demo-applications";
import { demoBackendSchemaVersion, type DemoBackendState } from "./types";

// Fixed metadata makes first-time initialization reproducible from the fictional source data.
const defaultUpdatedAt = "2026-10-26T05:00:00.000Z";

export function createDefaultDemoBackendState(): DemoBackendState {
  return {
    applications: structuredClone(demoApplications),
    complianceActivity: [],
    documents: structuredClone(demoDocuments),
    readAlertKeys: [],
    revision: 0,
    schemaVersion: demoBackendSchemaVersion,
    undertakings: structuredClone(demoUndertakings),
    updatedAt: defaultUpdatedAt,
    workflowHistory: [],
  };
}
