"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type RegionalOverviewChartProps = {
  data: Array<{ overdue: number; pending: number; region: string }>;
};

export function RegionalOverviewChart({ data }: RegionalOverviewChartProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Regional Processing Overview</h3>
          <p className="mt-1 text-sm text-slate-600">Pending and overdue fictional records updated within the selected range.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">DEMO DATA</span>
      </div>
      <div className="mt-6 h-80 min-w-0" role="img" aria-label="Bar chart comparing pending and overdue applications by region">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis axisLine={false} dataKey="region" tickLine={false} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "#f8fafc" }} />
            <Legend iconType="circle" />
            <Bar dataKey="pending" fill="#2563eb" name="Pending" radius={[4, 4, 0, 0]} />
            <Bar dataKey="overdue" fill="#dc2626" name="Overdue" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
