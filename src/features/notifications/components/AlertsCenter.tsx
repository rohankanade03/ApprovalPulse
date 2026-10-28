"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CheckCheck, Search, TriangleAlert } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDemoApplications } from "@/features/workflow/DemoApplicationStore";
import { alertDemoConfiguration } from "../config";
import { getDemoAlerts } from "../utils";

export function AlertsCenter() {
  const { applications, documents, undertakings, readAlertKeys, markAlertRead, markAllAlertsRead } = useDemoApplications();
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("All Severities");
  const [category, setCategory] = useState("All Categories");
  const [read, setRead] = useState("All");
  const [updating, setUpdating] = useState(false);
  const alerts = useMemo(() => getDemoAlerts(applications, undertakings, documents), [applications, documents, undertakings]);
  const visible = alerts.filter((alert) => (!query || `${alert.applicationId} ${alert.institution} ${alert.title} ${alert.message}`.toLowerCase().includes(query.toLowerCase())) && (severity === "All Severities" || alert.severity === severity) && (category === "All Categories" || alert.category === category) && (read === "All" || (read === "Unread") === !readAlertKeys.includes(alert.key)));
  const unread = alerts.filter((item) => !readAlertKeys.includes(item.key)).length;
  const overdue = alerts.filter((item) => item.overdueDays && item.overdueDays > 0).length;
  const markOne = async (key: string) => { if (updating) return; setUpdating(true); await markAlertRead(key); setUpdating(false); };
  const markAll = async () => { if (updating) return; setUpdating(true); await markAllAlertsRead(alerts.map((item) => item.key)); setUpdating(false); };

  return <PageContainer>
    <section className="border-b border-slate-200 pb-6"><span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">DEMO DATA</span><h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Alerts & Escalations</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Local demo notifications are derived from persisted demo state. No external messages, scheduler, or official escalation is sent.</p><p className="mt-2 text-xs text-slate-500">Escalation recommendation: unresolved items more than {alertDemoConfiguration.escalationAfterOverdueDays} days overdue under demo settings.</p></section>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Total Active Alerts", alerts.length, BellRing], ["Overdue Items", overdue, TriangleAlert], ["Upcoming Deadlines", alerts.filter((item) => !item.overdueDays && item.dueAt).length, BellRing], ["Unread Demo Notifications", unread, BellRing]].map(([label, value, Icon]) => { const CardIcon = Icon as typeof BellRing; return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={label as string}><div className="flex justify-between"><div><p className="text-sm text-slate-600">{label as string}</p><p className="mt-2 text-3xl font-semibold text-slate-900">{value as number}</p></div><CardIcon className="size-5 text-blue-700" /></div></article>; })}</section>
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-semibold text-slate-900">Local demo notifications</h3><p className="mt-1 text-sm text-slate-600">Reading an alert never resolves its underlying condition.</p></div><button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:text-slate-400" disabled={updating} onClick={markAll} type="button"><CheckCheck className="mr-1 inline size-4" />{updating ? "Updating…" : "Mark All as Read"}</button></div>
      <div className="mt-5 grid gap-3 md:grid-cols-4"><label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3"><Search className="size-4" /><input className="w-full bg-transparent text-sm outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Search alerts" value={query} /></label><select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" onChange={(event) => setSeverity(event.target.value)} value={severity}><option>All Severities</option>{["Critical", "High", "Medium", "Low"].map((item) => <option key={item}>{item}</option>)}</select><select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" onChange={(event) => setCategory(event.target.value)} value={category}><option>All Categories</option>{["Workflow", "EVC", "Undertaking", "Document Expiry"].map((item) => <option key={item}>{item}</option>)}</select><select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" onChange={(event) => setRead(event.target.value)} value={read}><option>All</option><option>Unread</option><option>Read</option></select></div>
      <div className="mt-5 divide-y divide-slate-100">{visible.map((alert) => { const isRead = readAlertKeys.includes(alert.key); return <article className={`py-4 ${isRead ? "opacity-70" : ""}`} key={alert.key}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{alert.category}</span><span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">{alert.severity}</span>{alert.overdueDays && alert.overdueDays > alertDemoConfiguration.escalationAfterOverdueDays ? <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">Demo escalation recommendation</span> : null}</div><p className="mt-2 text-sm font-semibold text-slate-900">{alert.title} · {alert.applicationId}</p><p className="mt-1 text-sm text-slate-600">{alert.institution} — {alert.message}</p></div><div className="flex gap-3"><Link className="text-sm font-semibold text-blue-700" href={alert.href}>Open</Link>{!isRead ? <button className="text-sm font-semibold text-slate-600 disabled:text-slate-400" disabled={updating} onClick={() => void markOne(alert.key)} type="button">Mark as Read</button> : null}</div></div></article>; })}{visible.length === 0 ? <p className="py-10 text-center text-sm text-slate-600">No active demo alerts match these filters.</p> : null}</div>
    </section>
  </PageContainer>;
}
