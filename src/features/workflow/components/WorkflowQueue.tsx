"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, CornerUpLeft, Forward, Search, TriangleAlert } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDemoRole } from "@/components/layout/DemoRoleProvider";
import { regions } from "@/features/dashboard/types";
import { formatDemoDate, isOpen, isOverdue } from "@/features/dashboard/utils";
import { ApplicationStatusBadge } from "@/features/applications/components/ApplicationStatusBadge";
import { applicationStages, applicationStatuses, defaultApplicationFilters, filterApplications, getStageAgeing, type ApplicationFilters } from "@/features/applications/utils";
import { useDemoApplications } from "../DemoApplicationStore";
import { demoRolePolicy } from "../config";

export function WorkflowQueue() {
  const { applications, getHistory } = useDemoApplications();
  const { role } = useDemoRole();
  const [filters, setFilters] = useState<ApplicationFilters>(defaultApplicationFilters);
  const visible = useMemo(() => filterApplications(applications, filters), [applications, filters]);
  const history = useMemo(() => applications.flatMap((application) => getHistory(application.id)), [applications, getHistory]);
  const rolePolicy = demoRolePolicy[role];
  const awaitingAction = applications.filter((application) => isOpen(application) && (rolePolicy.forwardStages.includes(application.stage) || rolePolicy.returnStages.includes(application.stage))).length;
  const updateFilter = <Key extends keyof ApplicationFilters>(key: Key, value: ApplicationFilters[Key]) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <PageContainer>
      <section className="border-b border-slate-200 pb-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">DEMO DATA</span><span className="text-xs text-slate-500">Local server demo state · not an official record</span></div><h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Workflow Monitor</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">Explore how fictional applications move through configurable illustrative stages. Transition rules are demonstration configuration, not AICTE regulations or timelines.</p></div>
        </div>
      </section>


      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{ label: "Awaiting your action", value: awaitingAction, icon: Clock3, tone: "bg-blue-50 text-blue-700" }, { label: "Overdue applications", value: applications.filter(isOverdue).length, icon: TriangleAlert, tone: "bg-red-50 text-red-700" }, { label: "Forwarded actions", value: history.filter((entry) => entry.action === "Forward").length, icon: Forward, tone: "bg-emerald-50 text-emerald-700" }, { label: "Returned actions", value: history.filter((entry) => entry.action === "Return").length, icon: CornerUpLeft, tone: "bg-amber-50 text-amber-700" }].map((item) => { const Icon = item.icon; return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={item.label}><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-600">{item.label}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{item.value}</p></div><span className={`grid size-10 place-items-center rounded-lg ${item.tone}`}><Icon aria-hidden="true" className="size-5" /></span></div><p className="mt-4 text-xs text-slate-500">Derived from persisted local demo state.</p></article>; })}
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><h3 className="text-base font-semibold text-slate-900">Workflow queue</h3><p className="mt-1 text-sm text-slate-600">Select an application to inspect its route and available illustrative actions.</p></div><button className="h-10 self-start rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setFilters(defaultApplicationFilters)} type="button">Reset Filters</button></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500"><Search aria-hidden="true" className="size-4" /><span className="sr-only">Search workflow queue</span><input className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" onChange={(event) => updateFilter("query", event.target.value)} placeholder="Search ID or institution" type="search" value={filters.query} /></label><label className="text-xs font-semibold text-slate-600">Region<select className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800" onChange={(event) => updateFilter("region", event.target.value as ApplicationFilters["region"])} value={filters.region}><option>All Regions</option>{regions.map((region) => <option key={region}>{region}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Current stage<select className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800" onChange={(event) => updateFilter("stage", event.target.value as ApplicationFilters["stage"])} value={filters.stage}><option>All Stages</option>{applicationStages.map((stage) => <option key={stage}>{stage}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Status<select className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800" onChange={(event) => updateFilter("status", event.target.value as ApplicationFilters["status"])} value={filters.status}><option>All Statuses</option>{applicationStatuses.map((status) => <option key={status}>{status}</option>)}</select></label></div>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="border-y border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Application ID</th><th className="px-3 py-3">Institution</th><th className="px-3 py-3">Region</th><th className="px-3 py-3">Current stage</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Stage ageing</th><th className="px-3 py-3">Last updated</th><th className="px-3 py-3"><span className="sr-only">Action</span></th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((application) => <tr className="text-slate-700" key={application.id}><td className="whitespace-nowrap px-3 py-4 font-semibold text-slate-900">{application.id}</td><td className="px-3 py-4 font-medium text-slate-800">{application.institution}</td><td className="whitespace-nowrap px-3 py-4">{application.region}</td><td className="whitespace-nowrap px-3 py-4">{application.stage}</td><td className="px-3 py-4"><ApplicationStatusBadge status={application.status} /></td><td className={`whitespace-nowrap px-3 py-4 font-medium ${isOverdue(application) ? "text-red-700" : "text-slate-700"}`}>{getStageAgeing(application)}</td><td className="whitespace-nowrap px-3 py-4 text-slate-500">{formatDemoDate(application.lastUpdatedAt)}</td><td className="px-3 py-4 text-right"><Link className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-blue-700 hover:text-blue-900" href={`/workflow/${application.id}`}>Manage Workflow <ArrowRight aria-hidden="true" className="size-4" /></Link></td></tr>)}</tbody></table></div>
        {visible.length === 0 ? <div className="grid min-h-52 place-items-center border-t border-slate-100 px-6 py-10 text-center"><div><Search aria-hidden="true" className="mx-auto size-6 text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-900">No workflow records found</p><p className="mt-1 text-sm text-slate-600">Clear a filter or try a different application ID or institution name.</p></div></div> : null}
      </section>
    </PageContainer>
  );
}
