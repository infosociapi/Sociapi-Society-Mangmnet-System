import type {
  User,
  Task,
  Event,
  FinanceEntry,
  OutreachContact,
  Application,
  MessageTemplate,
  NotificationItem,
  AttendanceRecord,
  ActivityLog,
  Role,
} from "../types";

let memberCounter = 1;
const nextMemberId = () =>
  `SOC-2026-${String(memberCounter++).padStart(4, "0")}`;

const today = new Date();
const daysAgo = (n: number) =>
  new Date(today.getTime() - n * 86400000).toISOString();

interface SeedPerson {
  name: string;
  position: string;
  special: string;
  role: Role;
  department: string;
  skills: string[];
}

const seedPeople: SeedPerson[] = [
  { name: "Muhammad Zuhair Zeb", position: "Founder & President", special: "SF_25100", role: "Super Admin", department: "Leadership", skills: ["Strategy", "Leadership", "Vision"] },
  { name: "Muhammad Mudassir", position: "Co-Founder & President", special: "SCF_25101", role: "Co-Founder", department: "Leadership", skills: ["Operations", "Strategy"] },
  { name: "Hamza Khan", position: "HR Manager", special: "SHR_25401", role: "HR Manager", department: "Human Resources", skills: ["Recruitment", "Mentoring"] },
  { name: "Sajid Ullah", position: "Outreach Member", special: "SOR_25803", role: "Outreach Manager", department: "Outreach", skills: ["Networking", "Sponsorships"] },
  { name: "Muhammad Faisal", position: "Video Editor", special: "SM_25903", role: "General Member", department: "Media", skills: ["Premiere Pro", "After Effects"] },
  { name: "Asiya Islam", position: "Women Lead", special: "SW_26111", role: "Department Lead", department: "Women's Wing", skills: ["Leadership", "Community"] },
  { name: "Maham Iqbal", position: "Women Co-Lead", special: "SW_26112", role: "Executive", department: "Women's Wing", skills: ["Coordination", "Events"] },
  { name: "Alina Kalim", position: "Decor Lead", special: "SD_26121", role: "Department Lead", department: "Decor", skills: ["Aesthetics", "Planning"] },
  { name: "Maimoona Iqbal", position: "Decor", special: "SD_26122", role: "General Member", department: "Decor", skills: ["Crafts", "Set Design"] },
  { name: "Shandana Qadir (Amal Khan)", position: "Graphic Designer", special: "SG_25132", role: "General Member", department: "Design", skills: ["Illustrator", "Photoshop"] },
  { name: "Bilal Muhammad", position: "General Secretary", special: "SS_25300", role: "Executive", department: "Administration", skills: ["Coordination", "Minutes"] },
  { name: "Muhammad Zakria", position: "Project Manager", special: "SP_25600", role: "Executive", department: "Projects", skills: ["Agile", "Planning"] },
  { name: "Muhammad Zulkifal", position: "Event Manager", special: "SE_25600", role: "Event Manager", department: "Events", skills: ["Logistics", "Hospitality"] },
  { name: "Muhammad Hammad Khan", position: "Technical Co-Lead", special: "ST_27100", role: "Department Lead", department: "Technical", skills: ["React", "Node", "DevOps"] },
  { name: "Muhammad Saad", position: "Media", special: "SM_25904", role: "General Member", department: "Media", skills: ["Photography", "Editing"] },
  { name: "Areesh Tahir", position: "Graphic Designers Lead", special: "SGL_26103", role: "Department Lead", department: "Design", skills: ["Branding", "Figma"] },
  { name: "Riyan Ahmad Khan", position: "Organizer", special: "SOG_26201", role: "General Member", department: "Operations", skills: ["Coordination"] },
  { name: "Muhammad Abdullah", position: "Graphic Designers Co-Lead", special: "SGCL_26104", role: "Executive", department: "Design", skills: ["Typography", "Layout"] },
  { name: "Danyal Yousafzai", position: "Organizer", special: "SOG_26202", role: "General Member", department: "Operations", skills: ["Logistics"] },
  { name: "Palwasha", position: "Organizer", special: "SOG_26203", role: "General Member", department: "Operations", skills: ["Coordination"] },
];

function emailFor(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/\(.+?\)/g, "")
      .trim()
      .replace(/\s+/g, ".")
      .replace(/[^a-z.]/g, "") + "@sociapi.org"
  );
}

function usernameFor(name: string) {
  return name
    .toLowerCase()
    .replace(/\(.+?\)/g, "")
    .trim()
    .replace(/\s+/g, ".")
    .replace(/[^a-z.]/g, "");
}

function colorFromName(name: string) {
  const palette = ["teal", "orange", "slate", "green", "blue", "rose", "cyan", "amber"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return palette[Math.abs(h) % palette.length];
}

// INITIAL RULE: every member starts with attendance=0%, points=0, status=Active
export const seedUsers: User[] = seedPeople.map((p, i) => ({
  id: `u${i + 1}`,
  username: usernameFor(p.name),
  memberId: nextMemberId(),
  specialNumber: p.special,
  name: p.name,
  email: emailFor(p.name),
  password: "password",
  role: p.role,
  position: p.position,
  department: p.department,
  skills: p.skills,
  joinDate: new Date().toISOString(),
  points: 0,
  attendance: 0,
  performanceScore: 0,
  status: "Active",
  certificates: [],
  activity: [{ date: new Date().toISOString(), action: "Joined Sociapi Nexus" }],
  phone: "+92 3" + (10000000 + i * 1111111),
  avatar: colorFromName(p.name),
}));

export const seedTasks: Task[] = [];

export const seedEvents: Event[] = [];

export const seedFinance: FinanceEntry[] = [];

export const seedOutreach: OutreachContact[] = [];

export const seedApplications: Application[] = [];

export const seedTemplates: MessageTemplate[] = [
  { id: "tpl1", name: "Welcome Email", channel: "Email", subject: "Welcome to Sociapi Nexus", body: "Hi {{name}},\n\nWelcome to Sociapi Nexus! Your member ID is {{memberId}}. We're thrilled to have you onboard.\n\n— Sociapi Team" },
  { id: "tpl2", name: "Task Reminder", channel: "Email", subject: "Task Reminder: {{task}}", body: "Hi {{name}},\n\nThis is a reminder that your task '{{task}}' is due on {{deadline}}.\n\n— Sociapi" },
  { id: "tpl3", name: "Warning Notice", channel: "Email", subject: "⚠ Warning: Overdue Task", body: "Hi {{name}},\n\nYour task '{{task}}' is now overdue. Please update its status immediately or contact your lead." },
  { id: "tpl4", name: "Event Invitation", channel: "Email", subject: "You're invited to {{event}}", body: "Hi {{name}},\n\nYou're invited to {{event}} on {{date}}. RSVP via your member dashboard." },
  { id: "tpl5", name: "Password Reset", channel: "Email", subject: "Reset your Sociapi password", body: "Hi {{name}},\n\nUse the link below to reset your password. If you didn't request this, ignore this email." },
  { id: "tpl6", name: "WhatsApp Event Reminder", channel: "WhatsApp", body: "Hi {{name}}, reminder for {{event}} on {{date}}. See you there!" },
];

export const seedNotifications: NotificationItem[] = [
  { id: "n1", title: "Welcome to Sociapi Nexus", body: "Your member dashboard is ready.", channel: "In-App", createdAt: daysAgo(0.1), read: false, type: "success" },
  { id: "n2", title: "Initial Setup Complete", body: "All members initialized: 0% attendance, 0 pts, Active.", channel: "In-App", createdAt: daysAgo(0.2), read: false, type: "info" },
];

// Start with NO attendance records — initial rule
export const seedAttendance: AttendanceRecord[] = [];

export const seedActivityLogs: ActivityLog[] = [
  { id: "log1", actorId: "u1", actorName: "Muhammad Zuhair Zeb", action: "Initialized Sociapi Nexus", category: "settings", createdAt: daysAgo(1) },
  { id: "log2", actorId: "u1", actorName: "Muhammad Zuhair Zeb", action: "Seeded 20 members with initial state", category: "members", createdAt: daysAgo(1) },
];
