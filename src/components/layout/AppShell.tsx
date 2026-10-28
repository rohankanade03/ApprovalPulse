"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/config/navigation";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { DemoRoleProvider } from "./DemoRoleProvider";
import { DemoApplicationStoreProvider } from "@/features/workflow/DemoApplicationStore";
import { DemoDataStatus } from "./DemoDataStatus";

export function AppShell({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const currentPage = navigationItems.find((item) => item.href === pathname || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)));

  return (
    <DemoRoleProvider>
      <DemoApplicationStoreProvider>
        <AppSidebar isMobileOpen={isMobileOpen} onNavigate={() => setIsMobileOpen(false)} />
        <div className="min-h-screen bg-slate-50 lg:pl-72">
          <AppHeader pageTitle={currentPage?.label ?? "ApprovalPulse"} onMenuClick={() => setIsMobileOpen(true)} />
          <DemoDataStatus />
          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </DemoApplicationStoreProvider>
    </DemoRoleProvider>
  );
}
