"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import type { DemoApplication } from "../types";
import { formatDemoDate } from "../utils";

type RecentActivityTableProps = { applications: DemoApplication[] };

const statusStyles = {
  Pending: "bg-blue-50 text-blue-700",
  "In Review": "bg-violet-50 text-violet-700",
  Overdue: "bg-red-50 text-red-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

export function RecentActivityTable({ applications }: RecentActivityTableProps) {
  const [search, setSearch] = useState("");
  const records = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applications
      .filter((application) => !query || [application.id, application.institution, application.region, application.stage, application.status].some((value) => value.toLowerCase().includes(query)))
      .sort((first, second) => second.lastUpdatedAt.localeCompare(first.lastUpdatedAt))
      .slice(0, 8);
  }, [applications, search]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Recent Application Activity</h3>
          <p className="mt-1 text-sm text-slate-600">Fictional records updated within the selected time range.</p>
        </div>
        <Link className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900" href="/applications">
          View applications <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <label className="mt-5 flex h-10 max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <Search aria-hidden="true" className="size-4" />
        <span className="sr-only">Search recent application activity</span>
        <input className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" onChange={(event) => setSearch(event.target.value)} placeholder="Search activity" type="search" value={search} />
      </label>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-y border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Application ID</th><th className="px-3 py-3">Institution</th><th className="px-3 py-3">Region</th><th className="px-3 py-3">Current stage</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Last updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((application) => (
              <tr className="text-slate-700" key={application.id}>
                <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-900">{application.id}</td><td className="px-3 py-3">{application.institution}</td><td className="whitespace-nowrap px-3 py-3">{application.region}</td><td className="whitespace-nowrap px-3 py-3">{application.stage}</td><td className="px-3 py-3"><span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[application.status]}`}>{application.status}</span></td><td className="whitespace-nowrap px-3 py-3 text-slate-500">{formatDemoDate(application.lastUpdatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No fictional activity matches this search.</p> : null}
      </div>
    </section>
  );
}
