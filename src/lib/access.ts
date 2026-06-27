import type { Role } from "../types";

// The ONLY Super Admin emails. Both spellings included to avoid typo lockout.
export const SUPER_ADMIN_EMAILS = [
  "zezuhair71@gmail.com",
  "zebzuhair71@gmail.com",
];
export const SUPER_ADMIN_EMAIL = SUPER_ADMIN_EMAILS[0];
export const SUPER_ADMIN_USERNAME = "zezuhair71";

export function isSuperAdminEmail(email?: string): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

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
  // Email is the source of truth — if the email matches, they are Super Admin.
  return isSuperAdminEmail(user.email) || user.username?.toLowerCase() === SUPER_ADMIN_USERNAME;
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
