import type { ApplicationStatus } from "@/features/dashboard/types";

const styles: Record<ApplicationStatus, string> = {
  Pending: "bg-blue-50 text-blue-700 ring-blue-100",
  "In Review": "bg-violet-50 text-violet-700 ring-violet-100",
  Overdue: "bg-red-50 text-red-700 ring-red-100",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>{status}</span>;
}
