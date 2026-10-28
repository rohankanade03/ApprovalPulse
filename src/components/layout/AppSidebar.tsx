"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";
import { navigationItems } from "@/config/navigation";

type AppSidebarProps = {
  isMobileOpen: boolean;
  onNavigate: () => void;
};

export function AppSidebar({ isMobileOpen, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isMobileOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
          onClick={onNavigate}
          type="button"
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#0b1f3a] text-slate-100 transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 px-6 py-6">
          <Link className="flex items-center gap-3" href="/dashboard" onClick={onNavigate}>
            <span className="grid size-10 place-items-center rounded-xl bg-blue-500 text-white shadow-sm shadow-blue-950/30">
              <Activity aria-hidden="true" className="size-5" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight text-white">ApprovalPulse</span>
              <span className="mt-0.5 block text-xs text-slate-400">AICTE Approval &amp; Compliance</span>
            </span>
          </Link>
        </div>

        <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-slate-300 hover:bg-white/8 hover:text-white"
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={onNavigate}
                >
                  <Icon aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={isActive ? 2.4 : 2} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="m-4 rounded-lg border border-blue-300/15 bg-white/5 px-3 py-3">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-blue-300">DEMO ENVIRONMENT</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Sample interface only. No live AICTE data is connected.</p>
        </div>
      </aside>
    </>
  );
}
