"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Search, SlidersHorizontal, TriangleAlert } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDemoRole } from "@/components/layout/DemoRoleProvider";
import { regions } from "@/features/dashboard/types";
import { useDemoApplications } from "@/features/workflow/DemoApplicationStore";
import { formatDemoDate, isOverdue } from "@/features/dashboard/utils";
import { applicationStages, applicationStatuses, defaultApplicationFilters, filterApplications, getRegistryMetrics, getStageAgeing, type ApplicationFilters } from "../utils";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

const summaryCards = [
  { key: "total", label: "Total", description: "Fictional application records", icon: SlidersHorizontal, tone: "bg-blue-50 text-blue-700" },
  { key: "pending", label: "Pending", description: "Open and within demo threshold", icon: Clock3, tone: "bg-amber-50 text-amber-700" },
  { key: "overdue", label: "Overdue", description: "Past current-stage demo threshold", icon: TriangleAlert, tone: "bg-red-50 text-red-700" },
  { key: "completed", label: "Completed", description: "Recorded as completed in demo data", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
] as const;

export function ApplicationsRegistry() {
  const [filters, setFilters] = useState<ApplicationFilters>(defaultApplicationFilters);
  const { role } = useDemoRole();
  const { applications: demoApplications } = useDemoApplications();
  const applications = useMemo(() => filterApplications(demoApplications, filters), [demoApplications, filters]);
  const metrics = useMemo(() => getRegistryMetrics(demoApplications), [demoApplications]);
  const updateFilter = <Key extends keyof ApplicationFilters>(key: Key, value: ApplicationFilters[Key]) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <PageContainer>
      <section className="border-b border-slate-200 pb-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">DEMO DATA</span>
              <span className="text-xs text-slate-500">Local fictional records only · no live AICTE system connection</span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Applications</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Review application progress, current processing stages, and pending items across the fictional demo register.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
            Demo view for <span className="font-semibold text-slate-800">{role}</span> · review and navigation only
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Application summary">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const value = metrics[card.key];
          return (
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={card.key}>
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-sm font-medium text-slate-600">{card.label}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p></div>
                <span className={`grid size-10 place-items-center rounded-lg ${card.tone}`}><Icon aria-hidden="true" className="size-5" /></span>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">{card.description}</p>
            </article>
          );
        })}
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Application register</h3>
            <p className="mt-1 text-sm text-slate-600">Search and refine the locally stored fictional records.</p>
          </div>
          <button className="h-10 self-start rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => setFilters(defaultApplicationFilters)} type="button">Reset Filters</button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500 xl:col-span-1">
            <Search aria-hidden="true" className="size-4" /><span className="sr-only">Search application ID or institution</span>
            <input className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" onChange={(event) => updateFilter("query", event.target.value)} placeholder="Search ID or institution" type="search" value={filters.query} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Region
            <select className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" onChange={(event) => updateFilter("region", event.target.value as ApplicationFilters["region"])} value={filters.region}>
              <option>All Regions</option>{regions.map((region) => <option key={region}>{region}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Stage
            <select className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" onChange={(event) => updateFilter("stage", event.target.value as ApplicationFilters["stage"])} value={filters.stage}>
              <option>All Stages</option>{applicationStages.map((stage) => <option key={stage}>{stage}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Status
            <select className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" onChange={(event) => updateFilter("status", event.target.value as ApplicationFilters["status"])} value={filters.status}>
              <option>All Statuses</option>{applicationStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="border-y border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Application ID</th><th className="px-3 py-3">Institution</th><th className="px-3 py-3">Region</th><th className="px-3 py-3">Current stage</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Stage ageing</th><th className="px-3 py-3">Last updated</th><th className="px-3 py-3"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((application) => (
                <tr className="text-slate-700" key={application.id}>
                  <td className="whitespace-nowrap px-3 py-4 font-semibold text-slate-900">{application.id}</td><td className="px-3 py-4 font-medium text-slate-800">{application.institution}</td><td className="whitespace-nowrap px-3 py-4">{application.region}</td><td className="whitespace-nowrap px-3 py-4">{application.stage}</td><td className="px-3 py-4"><ApplicationStatusBadge status={application.status} /></td><td className={`whitespace-nowrap px-3 py-4 font-medium ${isOverdue(application) ? "text-red-700" : "text-slate-700"}`}>{getStageAgeing(application)}</td><td className="whitespace-nowrap px-3 py-4 text-slate-500">{formatDemoDate(application.lastUpdatedAt)}</td><td className="whitespace-nowrap px-3 py-4 text-right"><Link className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900" href={`/applications/${application.id}`}>View Details <ArrowRight aria-hidden="true" className="size-4" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {applications.length === 0 ? <div className="grid min-h-52 place-items-center border-t border-slate-100 px-6 py-10 text-center"><div><Search aria-hidden="true" className="mx-auto size-6 text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-900">No applications found</p><p className="mt-1 text-sm text-slate-600">Try clearing a filter or searching with a different application ID or institution name.</p><button className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900" onClick={() => setFilters(defaultApplicationFilters)} type="button">Clear all filters</button></div></div> : null}
      </section>
    </PageContainer>
  );
}
