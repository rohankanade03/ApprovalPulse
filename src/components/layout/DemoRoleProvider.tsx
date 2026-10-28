"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { roleInitials, type DemoRole } from "@/types/roles";

type DemoRoleContextValue = {
  role: DemoRole;
  initials: string;
  setRole: (role: DemoRole) => void;
};

const DemoRoleContext = createContext<DemoRoleContextValue | null>(null);

export function DemoRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<DemoRole>("Institution");
  const value = useMemo(
    () => ({ role, initials: roleInitials[role], setRole }),
    [role],
  );

  return <DemoRoleContext.Provider value={value}>{children}</DemoRoleContext.Provider>;
}

export function useDemoRole() {
  const context = useContext(DemoRoleContext);

  if (!context) {
    throw new Error("useDemoRole must be used within DemoRoleProvider");
  }

  return context;
}
