"use client";

import { LoaderCircle, TriangleAlert } from "lucide-react";
import { useDemoApplications } from "@/features/workflow/DemoApplicationStore";

export function DemoDataStatus() {
  const { errorMessage, loading } = useDemoApplications();
  if (loading) return <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-800"><LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />Loading persisted demo data…</div>;
  if (errorMessage) return <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-900"><TriangleAlert aria-hidden="true" className="size-3.5" />{errorMessage}</div>;
  return null;
}
