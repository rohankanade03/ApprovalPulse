"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { demoApi, DemoApiError, loadDemoSnapshot } from "@/lib/demo-client/api";
import type { ApplicationStage, DemoApplication, DemoComplianceActivity, DemoDocument, DemoEvcVisit, DemoUndertaking, DemoWorkflowHistoryEntry } from "@/features/dashboard/types";
import type { DemoRole } from "@/types/roles";

type TransitionResult = { message: string; ok: boolean };
type AsyncTransition = Promise<TransitionResult>;

type DemoApplicationStoreValue = {
  applications: DemoApplication[];
  complianceActivity: DemoComplianceActivity[];
  completeEvcVisit: (id: string, role: DemoRole, completedAt: string, note?: string) => AsyncTransition;
  documents: DemoDocument[];
  errorMessage: string | null;
  forwardApplication: (id: string, role: DemoRole) => AsyncTransition;
  getHistory: (id: string) => DemoWorkflowHistoryEntry[];
  hydrated: boolean;
  loading: boolean;
  markAlertRead: (key: string) => AsyncTransition;
  markAllAlertsRead: (keys: string[]) => AsyncTransition;
  readAlertKeys: string[];
  refreshDemoState: () => Promise<void>;
  // No reset endpoint is exposed during API migration. This safely refreshes persisted demo data.
  resetDemoChanges: () => AsyncTransition;
  returnApplication: (id: string, role: DemoRole, destinationStage: ApplicationStage, reason: string) => AsyncTransition;
  reviewDocumentRenewal: (id: string, role: DemoRole, decision: "verify" | "return", reason?: string, renewedExpiresAt?: string) => AsyncTransition;
  reviewUndertaking: (id: string, role: DemoRole, decision: "verify" | "return", reason?: string) => AsyncTransition;
  scheduleEvcVisit: (id: string, role: DemoRole, visit: Omit<DemoEvcVisit, "completedAt" | "completionNote">, rescheduleReason?: string) => AsyncTransition;
  submitDocumentRenewal: (id: string, role: DemoRole, fileName: string, note?: string) => AsyncTransition;
  submitUndertaking: (id: string, role: DemoRole, fileName: string, note?: string) => AsyncTransition;
  undertakings: DemoUndertaking[];
};

const DemoApplicationStore = createContext<DemoApplicationStoreValue | null>(null);

function errorMessage(error: unknown) {
  return error instanceof DemoApiError ? error.message : "The local demo server could not be reached. No changes were saved.";
}

export function DemoApplicationStoreProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<DemoApplication[]>([]);
  const [history, setHistory] = useState<DemoWorkflowHistoryEntry[]>([]);
  const [undertakings, setUndertakings] = useState<DemoUndertaking[]>([]);
  const [documents, setDocuments] = useState<DemoDocument[]>([]);
  const [complianceActivity, setComplianceActivity] = useState<DemoComplianceActivity[]>([]);
  const [readAlertKeys, setReadAlertKeys] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storeError, setStoreError] = useState<string | null>(null);

  const refreshDemoState = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await loadDemoSnapshot();
      setApplications(snapshot.applications);
      setHistory(snapshot.workflowHistory);
      setUndertakings(snapshot.undertakings);
      setDocuments(snapshot.documents);
      setComplianceActivity(snapshot.complianceActivity);
      setReadAlertKeys(snapshot.readAlertKeys);
      setStoreError(null);
    } catch (error) {
      setStoreError(errorMessage(error));
    } finally {
      setHydrated(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshDemoState(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshDemoState]);

  const mutation = useCallback(async (operation: () => Promise<void>): AsyncTransition => {
    try {
      await operation();
      setStoreError(null);
      return { ok: true, message: "Demo data saved to the local server." };
    } catch (error) {
      const message = errorMessage(error);
      setStoreError(message);
      return { ok: false, message };
    }
  }, []);

  const forwardApplication = useCallback((id: string, role: DemoRole) => mutation(async () => {
    const result = await demoApi.forward(id, role);
    setApplications((current) => current.map((item) => item.id === id ? result.application : item));
    setHistory((current) => [...current, result.historyEntry]);
  }), [mutation]);
  const returnApplication = useCallback((id: string, role: DemoRole, destinationStage: ApplicationStage, reason: string) => mutation(async () => {
    const result = await demoApi.returnWorkflow(id, role, destinationStage, reason);
    setApplications((current) => current.map((item) => item.id === id ? result.application : item));
    setHistory((current) => [...current, result.historyEntry]);
  }), [mutation]);
  const scheduleEvcVisit = useCallback((id: string, role: DemoRole, visit: Omit<DemoEvcVisit, "completedAt" | "completionNote">, rescheduleReason?: string) => mutation(async () => {
    const result = await demoApi.scheduleEvc(id, { ...visit, demoRole: role, rescheduleReason });
    setApplications((current) => current.map((item) => item.id === id ? result.application : item));
    setHistory((current) => [...current, result.historyEntry]);
  }), [mutation]);
  const completeEvcVisit = useCallback((id: string, role: DemoRole, completedAt: string, note?: string) => mutation(async () => {
    const result = await demoApi.completeEvc(id, { completedAt, demoRole: role, note });
    setApplications((current) => current.map((item) => item.id === id ? result.application : item));
    setHistory((current) => [...current, result.historyEntry]);
  }), [mutation]);
  const submitUndertaking = useCallback((id: string, role: DemoRole, fileName: string, note?: string) => mutation(async () => {
    const result = await demoApi.submitUndertaking(id, { demoRole: role, evidenceFileName: fileName, note });
    setUndertakings((current) => current.map((item) => item.id === id ? result.record : item));
    setComplianceActivity((current) => [...current, result.activity]);
  }), [mutation]);
  const reviewUndertaking = useCallback((id: string, role: DemoRole, decision: "verify" | "return", reason?: string) => mutation(async () => {
    const result = await demoApi.reviewUndertaking(id, { decision, demoRole: role, reason });
    setUndertakings((current) => current.map((item) => item.id === id ? result.record : item));
    setComplianceActivity((current) => [...current, result.activity]);
  }), [mutation]);
  const submitDocumentRenewal = useCallback((id: string, role: DemoRole, fileName: string, note?: string) => mutation(async () => {
    const result = await demoApi.submitDocumentRenewal(id, { demoRole: role, renewalFileName: fileName, note });
    setDocuments((current) => current.map((item) => item.id === id ? result.record : item));
    setComplianceActivity((current) => [...current, result.activity]);
  }), [mutation]);
  const reviewDocumentRenewal = useCallback((id: string, role: DemoRole, decision: "verify" | "return", reason?: string, renewedExpiresAt?: string) => mutation(async () => {
    const result = await demoApi.reviewDocumentRenewal(id, { decision, demoRole: role, reason, renewedExpiresAt });
    setDocuments((current) => current.map((item) => item.id === id ? result.record : item));
    setComplianceActivity((current) => [...current, result.activity]);
  }), [mutation]);
  const markAlertRead = useCallback((key: string) => mutation(async () => {
    const result = await demoApi.setAlertRead(key, true);
    setReadAlertKeys(result.readAlertKeys);
  }), [mutation]);
  const markAllAlertsRead = useCallback(async (keys: string[]): AsyncTransition => {
    for (const key of keys) { const result = await markAlertRead(key); if (!result.ok) return result; }
    return { ok: true, message: "Active demo notifications marked as read." };
  }, [markAlertRead]);
  const resetDemoChanges = useCallback(async (): AsyncTransition => {
    await refreshDemoState();
    return { ok: false, message: "The server-backed demo state was refreshed. A reset endpoint is intentionally not exposed in this phase." };
  }, [refreshDemoState]);
  const getHistory = useCallback((id: string) => history.filter((entry) => entry.applicationId === id).sort((first, second) => second.occurredAt.localeCompare(first.occurredAt)), [history]);
  const value = useMemo(() => ({ applications, complianceActivity, completeEvcVisit, documents, errorMessage: storeError, forwardApplication, getHistory, hydrated, loading, markAlertRead, markAllAlertsRead, readAlertKeys, refreshDemoState, resetDemoChanges, returnApplication, reviewDocumentRenewal, reviewUndertaking, scheduleEvcVisit, submitDocumentRenewal, submitUndertaking, undertakings }), [applications, complianceActivity, completeEvcVisit, documents, storeError, forwardApplication, getHistory, hydrated, loading, markAlertRead, markAllAlertsRead, readAlertKeys, refreshDemoState, resetDemoChanges, returnApplication, reviewDocumentRenewal, reviewUndertaking, scheduleEvcVisit, submitDocumentRenewal, submitUndertaking, undertakings]);
  return <DemoApplicationStore.Provider value={value}>{children}</DemoApplicationStore.Provider>;
}

export function useDemoApplications() {
  const context = useContext(DemoApplicationStore);
  if (!context) throw new Error("useDemoApplications must be used within DemoApplicationStoreProvider");
  return context;
}
