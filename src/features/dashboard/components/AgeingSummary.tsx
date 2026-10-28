type AgeingSummaryProps = {
  data: Array<{ count: number; label: string; tone: "green" | "blue" | "amber" | "red" }>;
};

const tones = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-red-200 bg-red-50 text-red-800",
};

export function AgeingSummary({ data }: AgeingSummaryProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Application Ageing</h3>
      <p className="mt-1 text-sm text-slate-600">Time spent in the current stage, not the entire application age. Buckets are demo settings.</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {data.map((bucket) => (
          <div className={`rounded-lg border p-3 ${tones[bucket.tone]}`} key={bucket.label}>
            <p className="text-2xl font-semibold tabular-nums">{bucket.count}</p>
            <p className="mt-1 text-xs font-medium leading-5">{bucket.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
