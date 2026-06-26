import type { Role } from "../types";

// The ONE and ONLY Super Admin. Hardcoded so no one else can become Super Admin.
export const SUPER_ADMIN_EMAIL = "zezuhair71@gmail.com";
export const SUPER_ADMIN_USERNAME = "Muhammad Zuhair Zeb";

export type Section =
  | "me"
  | "id-card"
  | "dashboard"
  | "members"
  | "departments"
  | "tasks"
  | "attendance"
  | "events"
  | "finance"
  | "hr"
  | "outreach"
  | "leaderboard"
  | "ai"
  | "communications"
  | "chat"
  | "accounts"
  | "passwords"
  | "logs"
  | "architecture"
  | "settings";

// Sections everyone who is logged in can use.
const COMMON: Section[] = ["me", "id-card", "settings", "chat", "tasks", "leaderboard"];

// Per-role access. Super Admin handled separately (gets everything).
const ROLE_ACCESS: Record<Role, Section[]> = {
  "Super Admin": [], // handled as "all"
  Founder: [
    "dashboard", "members", "departments", "finance", "hr", "events",
    "attendance", "outreach", "communications", "accounts", "logs",
  ],
  "Co-Founder": [
    "dashboard", "members", "departments", "finance", "hr", "events",
    "attendance", "outreach", "communications",
  ],
  Executive: [
    "members", "departments", "events", "attendance", "outreach", "finance",
  ],
  "HR Manager": [
    "members", "departments", "hr", "attendance",
  ],
  "Finance Manager": [
    "finance", "attendance",
  ],
  "Outreach Manager": [
    "outreach", "attendance",
  ],
  "Event Manager": [
    "events", "attendance",
  ],
  "Department Lead": [
    "members", "attendance", "events",
  ],
  "General Member": [
    "events", "attendance",
  ],
};

export function isTheSuperAdmin(user: { email?: string; username?: string; role?: Role } | null): boolean {
  if (!user) return false;
  return (
    user.role === "Super Admin" &&
    (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL ||
      user.username?.toLowerCase() === SUPER_ADMIN_USERNAME)
  );
}

export function getAllowedSections(user: { email?: string; username?: string; role: Role } | null): Set<Section> {
  if (!user) return new Set();
  if (isTheSuperAdmin(user)) {
    // Super Admin gets every section.
    return new Set<Section>([
      ...COMMON,
      "dashboard", "members", "departments", "finance", "hr", "events",
      "attendance", "outreach", "communications", "ai", "accounts",
      "passwords", "logs", "architecture",
    ]);
  }
  return new Set<Section>([...COMMON, ...(ROLE_ACCESS[user.role] || [])]);
}

export function canAccess(user: { email?: string; username?: string; role: Role } | null, section: Section): boolean {
  return getAllowedSections(user).has(section);
}
