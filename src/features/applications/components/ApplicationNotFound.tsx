import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

export function ApplicationNotFound() {
  return <PageContainer><section className="grid min-h-[55vh] place-items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm"><div className="max-w-md"><span className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-600"><SearchX aria-hidden="true" className="size-6" /></span><h2 className="mt-5 text-xl font-semibold text-slate-900">Application not found</h2><p className="mt-2 text-sm leading-6 text-slate-600">This application ID is not available in the local fictional demo dataset.</p><Link className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800" href="/applications"><ArrowLeft aria-hidden="true" className="size-4" />Back to Applications</Link></div></section></PageContainer>;
}
