"use client";

import { useMemo, useState } from "react";
import { AlertCircle, BellRing, CalendarClock, ClipboardList, FileWarning, UsersRound } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDemoApplications } from "@/features/workflow/DemoApplicationStore";
import { getDemoAlerts } from "@/features/notifications/utils";
import type { Region, TimeRange } from "../types";
import { demoConfiguration, demoReferenceDate, filterByRegion, filterByTimeRange, getAgeingBuckets, getDashboardMetrics, getRegionalOverview, getStagePendency } from "../utils";
import { AgeingSummary } from "./AgeingSummary";
import { AttentionPanel } from "./AttentionPanel";
import { KpiCard } from "./KpiCard";
import { RecentActivityTable } from "./RecentActivityTable";
import { RegionalOverviewChart } from "./RegionalOverviewChart";
import { StagePendencyChart } from "./StagePendencyChart";

const regionOptions: Array<Region | "All Regions"> = ["All Regions", "North", "South", "East", "West", "Central"];
const timeRangeOptions: Array<{ label: string; value: TimeRange }> = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "This Quarter", value: "quarter" },
];

export function DashboardClient() {
  const [region, setRegion] = useState<Region | "All Regions">("All Regions");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const { applications: demoApplications, documents, undertakings } = useDemoApplications();
  const regionApplications = useMemo(() => filterByRegion(demoApplications, region), [demoApplications, region]);
  const recentApplications = useMemo(() => filterByTimeRange(regionApplications, timeRange), [regionApplications, timeRange]);
  const metrics = useMemo(() => getDashboardMetrics(regionApplications, undertakings, documents), [documents, regionApplications, undertakings]);
  const stageData = useMemo(() => getStagePendency(regionApplications), [regionApplications]);
  const regionalData = useMemo(() => getRegionalOverview(demoApplications, region, timeRange), [demoApplications, region, timeRange]);
  const ageingData = useMemo(() => getAgeingBuckets(regionApplications), [regionApplications]);
  const attentionItems = useMemo(() => getDemoAlerts(regionApplications, undertakings, documents).slice(0, 6).map((alert) => ({ applicationId: alert.applicationId, institution: alert.institution, issueType: alert.category, detail: alert.message, dueLabel: alert.overdueDays ? `${alert.overdueDays} days overdue` : alert.dueAt ? `Due ${alert.dueAt}` : "Review required", href: alert.href, severity: alert.severity })), [documents, regionApplications, undertakings]);

  const resetFilters = () => {
    setRegion("All Regions");
    setTimeRange("30d");
  };

  return (
    <PageContainer>
      <section className="border-b border-slate-200 pb-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">DEMO DATA</span>
              <span className="text-xs text-slate-500">Last updated {demoReferenceDate.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })} IST · local sample data</span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Approval Overview</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">Monitor application movement, processing timelines and institutional compliance.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:min-w-[560px]">
            <label className="text-xs font-semibold text-slate-600">Region
              <select className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" onChange={(event) => setRegion(event.target.value as Region | "All Regions")} value={region}>
                {regionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">Time range
              <select className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" onChange={(event) => setTimeRange(event.target.value as TimeRange)} value={timeRange}>
                {timeRangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <button className="mt-[21px] h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={resetFilters} type="button">Reset Filters</button>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">Demo configuration: applications are marked overdue after more than {demoConfiguration.overdueStageDays} days in their current stage; due-soon windows are sample settings, not AICTE rules.</p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Application overview metrics">
        <KpiCard description="All fictional applications in the selected region." icon={ClipboardList} label="Total Applications" value={metrics.total} />
        <KpiCard description="Open applications across current processing stages." icon={CalendarClock} label="Pending Applications" tone="slate" value={metrics.pending} />
        <KpiCard description="Open applications beyond the sample stage threshold." icon={AlertCircle} label="Overdue Applications" tone="red" value={metrics.overdue} />
        <KpiCard description="Open applications currently awaiting EVC activity." icon={UsersRound} label="Awaiting EVC" tone="amber" value={metrics.awaitingEvc} />
        <KpiCard description="Undertakings due within the seven-day demo window." icon={BellRing} label="Compliance Due Soon" tone="amber" value={metrics.complianceDueSoon} />
        <KpiCard description="Expired fictional documents awaiting renewed submission." icon={FileWarning} label="Expired Documents" tone="red" value={metrics.expiredDocuments} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <StagePendencyChart data={stageData} />
        <RegionalOverviewChart data={regionalData} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <AgeingSummary data={ageingData} />
        <AttentionPanel items={attentionItems} />
      </section>

      <section className="mt-6">
        <RecentActivityTable applications={recentApplications} />
      </section>
    </PageContainer>
  );
}
