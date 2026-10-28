import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createDefaultDemoBackendState } from "@/lib/demo-backend/default-state";
import { JsonDemoStateRepository } from "@/lib/demo-backend/json-repository";
import { getAuditEvents } from "@/lib/demo-backend/services/audit";
import { setAlertRead, AlertReadMutationError, getAlerts } from "@/lib/demo-backend/services/alerts";
import { reviewDocumentRenewal, reviewUndertaking, submitDocumentRenewal, submitUndertaking } from "@/lib/demo-backend/services/compliance";
import { completeEvcVisit, scheduleEvcVisit } from "@/lib/demo-backend/services/evc";
import { getDashboardSummary, getReport, toReportCsv } from "@/lib/demo-backend/services/reporting";
import { forwardWorkflowApplication, returnWorkflowApplication, WorkflowMutationError } from "@/lib/demo-backend/services/workflow";
import type { DemoBackendState, DemoStateMutation, DemoStateRepository } from "@/lib/demo-backend/types";
import { parseDemoBackendState } from "@/lib/demo-backend/validation";
import { demoEvcPolicy, demoRolePolicy, getWorkflowRoute, isEvcEligible } from "@/features/workflow/config";

class MemoryRepository implements DemoStateRepository {
  private state: DemoBackendState = createDefaultDemoBackendState();
  private queue: Promise<void> = Promise.resolve();

  async read() { return structuredClone(this.state); }
  async reset() { this.state = createDefaultDemoBackendState(); return structuredClone(this.state); }
  async update(mutation: DemoStateMutation) {
    const run = this.queue.then(async () => {
      const current = structuredClone(this.state);
      const next = parseDemoBackendState(await mutation(current));
      this.state = { ...next, revision: this.state.revision + 1, updatedAt: new Date().toISOString() };
      return structuredClone(this.state);
    });
    this.queue = run.then(() => undefined, () => undefined);
    return run;
  }
}

async function expectReject(task: Promise<unknown>, errorType: new (...args: never[]) => Error) {
  await assert.rejects(task, errorType);
}

async function main() {
  const repository = new MemoryRepository();
  const initial = await repository.read();
  assert.equal(initial.applications.length, 18, "defaults should retain the fictional application set");
  assert.doesNotThrow(() => parseDemoBackendState(initial));
  assert.throws(() => parseDemoBackendState({ ...initial, schemaVersion: 99 }));

  const forwardTarget = initial.applications.find((application) => demoRolePolicy["Regional Officer"].forwardStages.includes(application.stage));
  assert(forwardTarget, "a Regional Officer forward target is required");
  const deniedRevision = (await repository.read()).revision;
  await expectReject(forwardWorkflowApplication(repository, forwardTarget.id, "Institution"), WorkflowMutationError);
  assert.equal((await repository.read()).revision, deniedRevision, "denied workflow action must not write state");
  const forward = await forwardWorkflowApplication(repository, forwardTarget.id, "Regional Officer");
  assert.equal(forward.historyEntry.action, "Forward");
  assert.equal(forward.revision, deniedRevision + 1);
  const returned = await returnWorkflowApplication(repository, forwardTarget.id, "Regional Officer", forwardTarget.stage, "Illustrative missing evidence.");
  assert.equal(returned.historyEntry.reason, "Illustrative missing evidence.");
  assert.equal(returned.application.stage, forwardTarget.stage);

  const evcTarget = (await repository.read()).applications.find((application) => isEvcEligible(application) && !application.evcVisit);
  assert(evcTarget, "an unscheduled EVC application is required");
  const beforeEvc = structuredClone(evcTarget);
  const scheduled = await scheduleEvcVisit(repository, evcTarget.id, "Regional Officer", { committeeName: "Demo Committee", members: "Member A, Member B", scheduledAt: "2026-10-27" });
  assert.equal(scheduled.application.evcVisit?.scheduledAt, "2026-10-27");
  assert.equal(scheduled.application.stage, beforeEvc.stage, "scheduling must not change the workflow stage");
  assert.equal(scheduled.application.status, beforeEvc.status, "scheduling must not change application status");
  await expectReject(scheduleEvcVisit(repository, evcTarget.id, "Regional Officer", { committeeName: "Demo Committee", members: "Member A", scheduledAt: "2026-10-28" }), Error);
  const completed = await completeEvcVisit(repository, evcTarget.id, "EVC Member", "2026-10-26", "Illustrative visit complete.");
  assert.equal(completed.application.evcVisit?.completedAt, "2026-10-26");
  assert.equal(completed.application.stage, beforeEvc.stage, "completion must not approve or advance an application");
  await expectReject(completeEvcVisit(repository, evcTarget.id, "EVC Member", "2026-10-26"), Error);

  const undertaking = (await repository.read()).undertakings.find((record) => record.status === "Pending Submission");
  assert(undertaking, "a pending undertaking is required");
  await submitUndertaking(repository, undertaking.id, "Institution", "evidence.pdf", "Illustrative evidence metadata");
  await expectReject(reviewUndertaking(repository, undertaking.id, "Institution", "verify"), Error);
  const undertakingReview = await reviewUndertaking(repository, undertaking.id, "Regional Officer", "return", "Please correct the fictional evidence metadata.");
  assert.equal(undertakingReview.record.status, "Returned for Correction");

  const document = (await repository.read()).documents.find((record) => !["Renewal Submitted", "Renewal Verified"].includes(record.status));
  assert(document, "a document suitable for renewal is required");
  const previousExpiry = document.expiresAt;
  const submittedDocument = await submitDocumentRenewal(repository, document.id, "Institution", "renewal.pdf", "Illustrative renewal metadata");
  assert.equal(submittedDocument.record.expiresAt, previousExpiry, "submission must not change expiry");
  const documentReview = await reviewDocumentRenewal(repository, document.id, "Bureau Officer", "verify", undefined, "2027-12-31");
  assert.equal(documentReview.record.expiresAt, previousExpiry, "verification records new validity separately from the existing expiry");
  assert.equal(documentReview.record.renewedExpiresAt, "2027-12-31");

  const alert = getAlerts(await repository.read())[0];
  assert(alert, "at least one active alert is required");
  const readAlert = await setAlertRead(repository, alert.key, true);
  assert(readAlert.readAlertKeys.includes(alert.key));
  const unreadAlert = await setAlertRead(repository, alert.key, false);
  assert(!unreadAlert.readAlertKeys.includes(alert.key));
  await expectReject(setAlertRead(repository, "not-a-current-alert", true), AlertReadMutationError);

  const beforeConcurrent = (await repository.read()).revision;
  await Promise.all([repository.update((state) => ({ ...state, readAlertKeys: [...state.readAlertKeys, "integration-a"] })), repository.update((state) => ({ ...state, readAlertKeys: [...state.readAlertKeys, "integration-b"] }))]);
  const afterConcurrent = await repository.read();
  assert.equal(afterConcurrent.revision, beforeConcurrent + 2, "successful writes increment revision exactly once");
  assert(afterConcurrent.readAlertKeys.includes("integration-a") && afterConcurrent.readAlertKeys.includes("integration-b"), "serialized writes must retain both changes");

  const dashboard = getDashboardSummary(afterConcurrent, { range: "30d" });
  const report = getReport(afterConcurrent, { range: "30d" });
  assert.equal(dashboard.metrics.total, report.dashboard.metrics.total);
  const csv = toReportCsv({ ...report, applications: [{ ...report.applications[0], application: { ...report.applications[0].application, institution: "North, \"Quoted\"\nInstitute" } }] });
  assert(csv.includes('"North, ""Quoted""\nInstitute"'), "CSV must quote commas, quotes, and newlines");
  assert(getAuditEvents(afterConcurrent).length >= 6, "audit output must contain actual recorded mutation activity");

  const livePath = join(process.cwd(), "data", "approval-pulse-demo.json");
  const original = await readFile(livePath, "utf8");
  try {
    const first = new JsonDemoStateRepository();
    const liveBefore = await first.read();
    await first.update((state) => ({ ...state, readAlertKeys: [...state.readAlertKeys, "phase8-persistence-check"] }));
    const second = new JsonDemoStateRepository();
    const liveAfter = await second.read();
    assert(liveAfter.readAlertKeys.includes("phase8-persistence-check"), "a fresh repository instance must read persisted changes");
    assert.equal(liveAfter.revision, liveBefore.revision + 1);
    await Promise.all([
      first.update((state) => ({ ...state, readAlertKeys: [...state.readAlertKeys, "phase8-concurrent-a"] })),
      first.update((state) => ({ ...state, readAlertKeys: [...state.readAlertKeys, "phase8-concurrent-b"] })),
    ]);
    const concurrent = await first.read();
    assert(concurrent.readAlertKeys.includes("phase8-concurrent-a") && concurrent.readAlertKeys.includes("phase8-concurrent-b"), "the JSON repository must serialize in-process writes");
  } finally {
    await writeFile(livePath, original, "utf8");
  }
  console.log("demo-backend integration checks passed");
}

void main();
