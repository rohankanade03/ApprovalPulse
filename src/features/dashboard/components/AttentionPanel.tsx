import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import type { AttentionItem } from "../types";

type AttentionPanelProps = { items: AttentionItem[] };

const severityStyles = {
  Critical: "bg-red-100 text-red-800",
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-blue-50 text-blue-700",
};

export function AttentionPanel({ items }: AttentionPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Attention Required</h3>
          <p className="mt-1 text-sm text-slate-600">Demo signals based on configured sample thresholds.</p>
        </div>
        <AlertTriangle aria-hidden="true" className="size-5 text-amber-600" />
      </div>
      <div className="mt-4 divide-y divide-slate-100">
        {items.map((item) => (
          <div className="py-4 first:pt-0" key={`${item.applicationId}-${item.issueType}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{item.applicationId}</p>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${severityStyles[item.severity]}`}>{item.severity}</span>
            </div>
            <p className="mt-1 text-sm text-slate-700">{item.institution}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{item.issueType} · {item.detail}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-600">{item.dueLabel}</span>
              <Link className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900" href={item.href}>
                Review <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
