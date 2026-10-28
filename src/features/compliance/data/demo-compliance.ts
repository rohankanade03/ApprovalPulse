import type { DemoDocument, DemoUndertaking } from "@/features/dashboard/types";

export const demoUndertakings: DemoUndertaking[] = [
  { id: "UND-1042", applicationId: "AP-2026-1042", title: "Faculty availability undertaking", dueAt: "2026-10-30", status: "Pending Submission" },
  { id: "UND-1046", applicationId: "AP-2026-1046", title: "Infrastructure compliance undertaking", dueAt: "2026-10-24", status: "Returned for Correction", submittedAt: "2026-10-20", evidenceFileName: "infrastructure-note.pdf", returnReason: "Demo reviewer requested a clearer supporting note." },
  { id: "UND-1020", applicationId: "AP-2026-1020", title: "Laboratory readiness undertaking", dueAt: "2026-10-27", status: "Submitted for Verification", submittedAt: "2026-10-24", evidenceFileName: "lab-readiness.pdf" },
  { id: "UND-1050", applicationId: "AP-2026-1050", title: "Governance disclosure undertaking", dueAt: "2026-10-22", status: "Verified", submittedAt: "2026-10-18", evidenceFileName: "governance-disclosure.pdf" },
];

export const demoDocuments: DemoDocument[] = [
  { id: "DOC-1038", applicationId: "AP-2026-1038", name: "Campus lease deed", documentType: "Lease document", issuedAt: "2021-10-20", expiresAt: "2026-10-20", status: "Expired" },
  { id: "DOC-1049", applicationId: "AP-2026-1049", name: "Land possession record", documentType: "Land record", issuedAt: "2021-10-18", expiresAt: "2026-10-18", status: "Renewal Submitted", renewalFileName: "land-record-renewal.pdf", renewalSubmittedAt: "2026-10-22" },
  { id: "DOC-1040", applicationId: "AP-2026-1040", name: "Building safety certificate", documentType: "Safety certificate", issuedAt: "2025-10-25", expiresAt: "2026-10-25", status: "Expired" },
  { id: "DOC-1011", applicationId: "AP-2026-1011", name: "Fire safety certificate", documentType: "Safety certificate", issuedAt: "2025-11-12", expiresAt: "2026-11-12", status: "Expiring Soon" },
  { id: "DOC-1022", applicationId: "AP-2026-1022", name: "Academic block lease", documentType: "Lease document", issuedAt: "2023-11-04", expiresAt: "2026-11-04", status: "Current" },
  { id: "DOC-1051", applicationId: "AP-2026-1051", name: "Laboratory accreditation record", documentType: "Accreditation record", issuedAt: "2026-01-10", expiresAt: "2027-01-10", status: "Renewal Verified", renewalFileName: "lab-accreditation-renewal.pdf", renewalSubmittedAt: "2026-10-15", renewedExpiresAt: "2027-10-25" },
];
