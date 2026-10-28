import { Construction, FolderOpen } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

type ModulePlaceholderProps = {
  description: string;
  title: string;
};

export function ModulePlaceholder({ description, title }: ModulePlaceholderProps) {
  return (
    <PageContainer>
      <div className="border-b border-slate-200 pb-6">
        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          Module in development
        </span>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
      </div>

      <section className="mt-8 grid min-h-80 place-items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
        <div className="max-w-md">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-700">
            <Construction aria-hidden="true" className="size-6" />
          </div>
          <h3 className="mt-5 text-base font-semibold text-slate-900">This workspace is being prepared</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The {title.toLowerCase()} experience will appear here in a future phase. No live records or workflow actions are available in this demo shell.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
            <FolderOpen aria-hidden="true" className="size-4" />
            Empty workspace
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
