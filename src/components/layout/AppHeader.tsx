"use client";

import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import Link from "next/link";
import { demoRoles, type DemoRole } from "@/types/roles";
import { useDemoRole } from "./DemoRoleProvider";
import { useDemoApplications } from "@/features/workflow/DemoApplicationStore";
import { getDemoAlerts } from "@/features/notifications/utils";

type AppHeaderProps = {
  pageTitle: string;
  onMenuClick: () => void;
};

export function AppHeader({ pageTitle, onMenuClick }: AppHeaderProps) {
  const { initials, role, setRole } = useDemoRole();
  const { applications, documents, readAlertKeys, undertakings } = useDemoApplications();
  const unreadAlerts = getDemoAlerts(applications, undertakings, documents).filter((alert) => !readAlertKeys.includes(alert.key)).length;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-h-10 items-center gap-3">
        <button
          aria-label="Open navigation"
          className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
        <div className="min-w-0 flex-1 lg:flex-none">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">ApprovalPulse</p>
          <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900">{pageTitle}</h1>
        </div>

        <label className="hidden h-10 w-full max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500 md:flex">
          <Search aria-hidden="true" className="size-4" />
          <span className="sr-only">Search</span>
          <input
            aria-label="Search"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Search applications, institutions..."
            type="search"
          />
        </label>

        <Link
          aria-label="Open local demo notifications"
          className="relative grid size-10 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
          href="/alerts"
        >
          <Bell aria-hidden="true" className="size-5" />
          {unreadAlerts ? <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-blue-600 px-1 text-center text-[10px] font-bold leading-4 text-white">{unreadAlerts > 9 ? "9+" : unreadAlerts}</span> : null}
        </Link>

        <div className="hidden min-w-40 sm:block">
          <label className="sr-only" htmlFor="demo-role">
            Demo role
          </label>
          <div className="relative">
            <select
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              id="demo-role"
              onChange={(event) => setRole(event.target.value as DemoRole)}
              value={role}
            >
              {demoRoles.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-3 size-4 text-slate-500" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-l border-slate-200 pl-3 sm:pl-4">
          <span className="grid size-9 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">{initials}</span>
          <span className="hidden text-sm font-medium text-slate-700 xl:block">{role}</span>
        </div>
      </div>
    </header>
  );
}
