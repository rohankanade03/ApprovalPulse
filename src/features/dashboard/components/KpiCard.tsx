import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  description: string;
  icon: LucideIcon;
  label: string;
  tone?: "blue" | "amber" | "red" | "slate";
  value: number;
};

const tones = {
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-700",
};

export function KpiCard({ description, icon: Icon, label, tone = "blue", value }: KpiCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{value.toLocaleString("en-IN")}</p>
        </div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">{description}</p>
    </article>
  );
}
