"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, CalendarDays, CheckCircle2, CircleAlert, ClipboardList, ExternalLink, FileClock, FileText, LayoutDashboard, MapPin } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDemoRole } from "@/components/layout/DemoRoleProvider";
import { formatDemoDate, isOverdue } from "@/features/dashboard/utils";
import { getRecordMilestones, getStageAgeing } from "../utils";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { useDemoApplications } from "@/features/workflow/DemoApplicationStore";
import { ApplicationNotFound } from "./ApplicationNotFound";
import { getEvcStatus } from "@/features/evc/utils";
import { getDocumentStatus } from "@/features/compliance/utils";

export function ApplicationDetails({ applicationId }: { applicationId: string }) {
  const { role } = useDemoRole();
  const { applications, documents, getHistory, hydrated, undertakings } = useDemoApplications();
  const application = applications.find((item) => item.id === applicationId);
  if (!hydrated) return <PageContainer><p className="py-12 text-sm text-slate-600">Loading local demo application data…</p></PageContainer>;
  if (!application) return <ApplicationNotFound />;
  const overdue = isOverdue(application);
  const milestones = getRecordMilestones(application);
  const demoHistory = getHistory(application.id);
  const evcStatus = getEvcStatus(application);
  const undertakingRecords = undertakings.filter((item) => item.applicationId === application.id);
  const documentRecords = documents.filter((item) => item.applicationId === application.id);
  const complianceItems = [
    ...undertakingRecords.map((item) => ({ label: `Undertaking · ${item.status}`, date: item.dueAt, href: "/undertakings", icon: FileText })),
    ...documentRecords.map((item) => ({ label: `${item.documentType} · ${getDocumentStatus(item)}`, date: item.renewedExpiresAt ?? item.expiresAt, href: "/documents", icon: FileClock })),
    undertakingRecords.length === 0 && application.undertakingDueAt ? { label: "Undertaking due", date: application.undertakingDueAt, href: "/undertakings", icon: FileText } : null,
    documentRecords.length === 0 && application.documentExpiryAt ? { label: "Document validity date", date: application.documentExpiryAt, href: "/documents", icon: FileClock } : null,
    application.evcVisit ? { label: `EVC visit · ${evcStatus}`, date: application.evcVisit.scheduledAt, href: "/evc", icon: CalendarDays } : application.evcSchedulingDueAt ? { label: "EVC scheduling due", date: application.evcSchedulingDueAt, href: "/evc", icon: CalendarDays } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <PageContainer>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <Link className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-900" href="/applications"><ArrowLeft aria-hidden="true" className="size-4" />Back to Applications</Link>
        <Link className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900" href="/dashboard"><LayoutDashboard aria-hidden="true" className="size-4" />Dashboard</Link>
      </div>

      <section className="mt-5 border-b border-slate-200 pb-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">DEMO DATA</span><span className="text-xs text-slate-500">Fictional application record · not connected to AICTE systems</span></div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{application.institution}</h2>
            <p className="mt-2 text-sm font-medium text-slate-600">{application.id}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2"><ApplicationStatusBadge status={application.status} />{overdue ? <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"><CircleAlert aria-hidden="true" className="size-3.5" />Past demo stage threshold</span> : null}</div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">Demo view for <span className="font-semibold text-slate-800">{role}</span>. This page supports review and navigation only; it does not provide real authorization or workflow actions.</p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><MapPin aria-hidden="true" className="size-5 text-blue-700" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Region</p><p className="mt-1 text-base font-semibold text-slate-900">{application.region}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><ClipboardList aria-hidden="true" className="size-5 text-blue-700" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Current stage</p><p className="mt-1 text-base font-semibold text-slate-900">{application.stage}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><CalendarDays aria-hidden="true" className="size-5 text-blue-700" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Stage entered</p><p className="mt-1 text-base font-semibold text-slate-900">{formatDemoDate(application.stageEnteredAt)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><CircleAlert aria-hidden="true" className={`size-5 ${overdue ? "text-red-700" : "text-blue-700"}`} /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Current stage ageing</p><p className={`mt-1 text-base font-semibold ${overdue ? "text-red-700" : "text-slate-900"}`}>{getStageAgeing(application)}</p></article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Application journey</h3>
          <p className="mt-1 text-sm text-slate-600">Available record milestones only. This is not a complete workflow history or audit trail.</p>
          <ol className="mt-6 space-y-5 border-l border-slate-200 pl-5">
            {milestones.map((milestone, index) => <li className="relative" key={`${milestone.label}-${milestone.date}`}><span className={`absolute -left-[29px] top-0.5 grid size-4 place-items-center rounded-full ring-4 ring-white ${index === milestones.length - 1 ? "bg-blue-600" : "bg-slate-300"}`}>{index === milestones.length - 1 ? <CheckCircle2 aria-hidden="true" className="size-3 text-white" /> : null}</span><p className="text-sm font-semibold text-slate-900">{milestone.label}</p><p className="mt-1 text-xs font-medium text-slate-500">{formatDemoDate(milestone.date)}</p><p className="mt-1 text-sm leading-6 text-slate-600">{milestone.description}</p></li>)}
          </ol>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><Building2 aria-hidden="true" className="size-5 text-blue-700" /><h3 className="text-base font-semibold text-slate-900">Record information</h3></div>
          <dl className="mt-5 divide-y divide-slate-100 text-sm"><div className="flex justify-between gap-4 py-3 first:pt-0"><dt className="text-slate-500">Application ID</dt><dd className="font-semibold text-slate-900">{application.id}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Submitted</dt><dd className="font-medium text-slate-800">{formatDemoDate(application.submittedAt)}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Last updated</dt><dd className="font-medium text-slate-800">{formatDemoDate(application.lastUpdatedAt)}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Status</dt><dd><ApplicationStatusBadge status={application.status} /></dd></div></dl>
        </article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-base font-semibold text-slate-900">Documents & compliance</h3><p className="mt-1 text-sm text-slate-600">Only date fields available in the fictional record are shown.</p>{complianceItems.length > 0 ? <div className="mt-5 divide-y divide-slate-100">{complianceItems.map((item) => { const Icon = item.icon; return <div className="flex items-center justify-between gap-4 py-3 first:pt-0" key={item.label}><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-700"><Icon aria-hidden="true" className="size-4" /></span><div><p className="text-sm font-semibold text-slate-900">{item.label}</p><p className="mt-0.5 text-xs text-slate-500">{formatDemoDate(item.date)}</p></div></div><Link className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900" href={item.href}>Open <ArrowRight aria-hidden="true" className="size-3.5" /></Link></div>; })}</div> : <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">Demo placeholder: no document checklist or compliance dates are available for this fictional record.</div>}</article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-base font-semibold text-slate-900">Recent record activity</h3><p className="mt-1 text-sm text-slate-600">Demo state changes appear here; this is not a verified official audit trail.</p><div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5">{demoHistory.length > 0 ? <div className="space-y-3">{demoHistory.slice(0, 3).map((entry) => <div key={entry.id}><p className="text-sm font-semibold text-slate-800">{entry.action}: {entry.fromStage} → {entry.toStage}</p><p className="mt-1 text-xs text-slate-500">{entry.actorRole} · {new Date(entry.occurredAt).toLocaleString("en-IN")}</p>{entry.reason ? <p className="mt-1 text-sm text-slate-600">Reason: {entry.reason}</p> : null}</div>)}</div> : <><p className="text-sm font-semibold text-slate-800">No demo workflow actions yet</p><p className="mt-1 text-sm text-slate-600">The local record was last updated on {formatDemoDate(application.lastUpdatedAt)}. Any actions in the workflow module will appear here.</p></>}<Link className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900" href="/audit">View audit trail module <ExternalLink aria-hidden="true" className="size-3.5" /></Link></div></article>
      </section>
    </PageContainer>
  );
}
