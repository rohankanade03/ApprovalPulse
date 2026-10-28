"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDemoApplications } from "@/features/workflow/DemoApplicationStore";
import { filterByRegion, filterByTimeRange, getDashboardMetrics, getRegionalOverview, getStagePendency } from "@/features/dashboard/utils";
import type { Region, TimeRange } from "@/features/dashboard/types";
import { getDocumentStatus, getUndertakingTiming } from "@/features/compliance/utils";
import { getDemoAlerts } from "@/features/notifications/utils";
import { StagePendencyChart } from "@/features/dashboard/components/StagePendencyChart";
import { RegionalOverviewChart } from "@/features/dashboard/components/RegionalOverviewChart";

export function ReportsClient() {
  const { applications, documents, undertakings } = useDemoApplications();
  const [region, setRegion] = useState<Region | "All Regions">("All Regions");
  const [range, setRange] = useState<TimeRange>("30d");
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => filterByTimeRange(filterByRegion(applications, region), range).filter((item) => `${item.id} ${item.institution}`.toLowerCase().includes(query.toLowerCase())),
    [applications, query, range, region],
  );
  const filteredIds = useMemo(() => new Set(filtered.map((item) => item.id)), [filtered]);
  const scopedUndertakings = useMemo(() => undertakings.filter((record) => filteredIds.has(record.applicationId)), [filteredIds, undertakings]);
  const scopedDocuments = useMemo(() => documents.filter((record) => filteredIds.has(record.applicationId)), [documents, filteredIds]);
  const metrics = useMemo(() => getDashboardMetrics(filtered, scopedUndertakings, scopedDocuments), [filtered, scopedDocuments, scopedUndertakings]);
  const stage = useMemo(() => getStagePendency(filtered), [filtered]);
  const regional = useMemo(() => getRegionalOverview(applications, region, range), [applications, region, range]);
  const alerts = useMemo(() => getDemoAlerts(filtered, scopedUndertakings, scopedDocuments), [filtered, scopedDocuments, scopedUndertakings]);
  const resetFilters = () => { setRegion("All Regions"); setRange("30d"); setQuery(""); };
  const exportCsv = () => {
    const parameters = new URLSearchParams({ range, search: query });
    if (region !== "All Regions") parameters.set("region", region);
    const link = document.createElement("a");
    link.href = `/api/reports/export.csv?${parameters.toString()}`;
    link.click();
  };

  return <PageContainer>
    <section className="border-b border-slate-200 pb-6"><span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">DEMO DATA</span><h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Reports & Analytics</h2><p className="mt-2 text-sm text-slate-600">Fictional shared demo records and illustrative thresholds only—not official AICTE statistics or performance measures.</p></section>
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="grid gap-3 md:grid-cols-5"><label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3"><Search className="size-4" /><input className="w-full bg-transparent text-sm outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Search applications" value={query} /></label><select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" onChange={(event) => setRegion(event.target.value as Region | "All Regions")} value={region}><option>All Regions</option>{["North", "South", "East", "West", "Central"].map((item) => <option key={item}>{item}</option>)}</select><select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" onChange={(event) => setRange(event.target.value as TimeRange)} value={range}><option value="7d">Last 7 Days</option><option value="30d">Last 30 Days</option><option value="quarter">This Quarter</option></select><button className="rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700" onClick={resetFilters} type="button">Reset Filters</button><button className="rounded-lg border border-slate-200 px-3 text-sm font-semibold disabled:text-slate-400" disabled={!filtered.length} onClick={exportCsv} type="button"><Download className="mr-1 inline size-4" />Export CSV</button></div>{!filtered.length ? <p className="mt-3 text-sm text-amber-700">No matching records are available to export.</p> : null}</section>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[["Total applications", metrics.total], ["Pending", metrics.pending], ["Overdue", metrics.overdue], ["Awaiting EVC", metrics.awaitingEvc], ["Compliance due soon", metrics.complianceDueSoon], ["Expired documents", metrics.expiredDocuments]].map(([label, value]) => <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={label as string}><p className="text-sm text-slate-600">{label as string}</p><p className="mt-2 text-3xl font-semibold text-slate-900">{value as number}</p></article>)}</section>
    <section className="mt-6 grid gap-6 xl:grid-cols-2"><StagePendencyChart data={stage} /><RegionalOverviewChart data={regional} /></section>
    <section className="mt-6 grid gap-6 xl:grid-cols-2"><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-900">Compliance overview</h3><div className="mt-4 space-y-3 text-sm text-slate-700"><p>Undertakings due soon: <b>{scopedUndertakings.filter((item) => getUndertakingTiming(item).dueSoon).length}</b></p><p>Undertakings overdue: <b>{scopedUndertakings.filter((item) => getUndertakingTiming(item).overdue).length}</b></p><p>Awaiting undertaking verification: <b>{scopedUndertakings.filter((item) => item.status === "Submitted for Verification").length}</b></p><p>Documents awaiting renewal verification: <b>{scopedDocuments.filter((item) => getDocumentStatus(item) === "Renewal Submitted").length}</b></p></div><Link className="mt-4 inline-block text-sm font-semibold text-blue-700" href="/undertakings">Open compliance modules</Link></article><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-900">Escalation summary</h3><p className="mt-1 text-sm text-slate-600">Derived from the same active alert selector used by Alerts & Escalations.</p><p className="mt-4 text-3xl font-semibold text-red-700">{alerts.filter((item) => item.severity === "Critical").length}</p><p className="mt-1 text-sm text-slate-600">Critical demo escalation recommendations</p><Link className="mt-4 inline-block text-sm font-semibold text-blue-700" href="/alerts">Open alerts</Link></article></section>
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-900">Filtered application report</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[750px] text-left text-sm"><thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Application ID</th><th className="p-3">Institution</th><th className="p-3">Region</th><th className="p-3">Stage</th><th className="p-3">Status</th><th className="p-3">Compliance</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((item) => <tr key={item.id}><td className="p-3"><Link className="font-semibold text-blue-700" href={`/applications/${item.id}`}>{item.id}</Link></td><td className="p-3">{item.institution}</td><td className="p-3">{item.region}</td><td className="p-3">{item.stage}</td><td className="p-3">{item.status}</td><td className="p-3">{scopedUndertakings.some((record) => record.applicationId === item.id && record.status !== "Verified") || scopedDocuments.some((record) => record.applicationId === item.id && ["Expired", "Expiring Soon", "Renewal Submitted"].includes(getDocumentStatus(record))) ? <span className="text-amber-700">Needs review</span> : "Current"}</td></tr>)}</tbody></table></div></section>
  </PageContainer>;
}
