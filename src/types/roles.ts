export const demoRoles = [
  "Institution",
  "Regional Officer",
  "Bureau Officer",
  "EVC Member",
  "Administrator",
] as const;

export type DemoRole = (typeof demoRoles)[number];

export const roleInitials: Record<DemoRole, string> = {
  Institution: "IN",
  "Regional Officer": "RO",
  "Bureau Officer": "BO",
  "EVC Member": "EM",
  Administrator: "AD",
};
