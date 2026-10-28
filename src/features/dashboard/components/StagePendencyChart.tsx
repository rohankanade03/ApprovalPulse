"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type StagePendencyChartProps = {
  data: Array<{ stage: string; count: number }>;
};

export function StagePendencyChart({ data }: StagePendencyChartProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Stage-wise Pendency</h3>
          <p className="mt-1 text-sm text-slate-600">Open applications only. Completed stages are excluded from this pendency view.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">DEMO DATA</span>
      </div>
      <div className="mt-6 h-80 min-w-0" role="img" aria-label="Horizontal bar chart of pending applications by approval stage">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 18, bottom: 0, left: 22 }}>
            <CartesianGrid horizontal={false} stroke="#e2e8f0" />
            <XAxis allowDecimals={false} axisLine={false} tickLine={false} type="number" />
            <YAxis axisLine={false} dataKey="stage" tick={{ fill: "#475569", fontSize: 12 }} tickLine={false} type="category" width={108} />
            <Tooltip cursor={{ fill: "#eff6ff" }} formatter={(value) => [value ?? 0, "Open applications"]} />
            <Bar dataKey="count" fill="#2563eb" maxBarSize={28} name="Open applications" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
