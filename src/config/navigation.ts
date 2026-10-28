import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  ClipboardList,
  FileClock,
  FileText,
  Gauge,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  UsersRound,
  Workflow,
} from "lucide-react";

export type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export const navigationItems: NavigationItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/applications", icon: ClipboardList, label: "Applications" },
  { href: "/workflow", icon: Workflow, label: "Workflow Monitor" },
  { href: "/evc", icon: UsersRound, label: "EVC Scheduling" },
  { href: "/undertakings", icon: FileText, label: "Undertakings" },
  { href: "/documents", icon: FileClock, label: "Document Validity" },
  { href: "/alerts", icon: BellRing, label: "Alerts & Escalations" },
  { href: "/audit", icon: ShieldAlert, label: "Audit Trail" },
  { href: "/reports", icon: Gauge, label: "Reports" },
  { href: "/settings", icon: Settings, label: "Settings" },
];
