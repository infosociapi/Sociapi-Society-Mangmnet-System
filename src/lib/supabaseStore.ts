import type {
  ActivityLog,
  Application,
  AttendanceRecord,
  ChatMessage,
  Department,
  Event,
  FinanceEntry,
  MessageTemplate,
  NotificationItem,
  OutreachContact,
  Task,
  User,
} from "../types";
import { isSupabaseConfigured, supabase, SUPABASE_STORAGE_BUCKET } from "./supabase";

export interface ErpStateSnapshot {
  users: User[];
  tasks: Task[];
  events: Event[];
  finance: FinanceEntry[];
  outreach: OutreachContact[];
  applications: Application[];
  templates: MessageTemplate[];
  notifications: NotificationItem[];
  attendance: AttendanceRecord[];
  activityLogs: ActivityLog[];
  departments: Department[];
  chats: ChatMessage[];
}

function isUuid(id?: string) {
  return !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export async function loadErpState(): Promise<ErpStateSnapshot | null> {
  if (!isSupabaseConfigured) return null;
  const [members, departments, events, finance, outreach, applications, notifications, attendance, audit, chat, tasks, assignees, submissions] = await Promise.all([
    supabase.from("members").select("*"),
    supabase.from("departments").select("*"),
    supabase.from("events").select("*"),
    supabase.from("finance_entries").select("*"),
    supabase.from("outreach").select("*"),
    supabase.from("hr_applications").select("*"),
    supabase.from("notifications").select("*"),
    supabase.from("attendance").select("*"),
    supabase.from("audit_logs").select("*"),
    supabase.from("chat").select("*"),
    supabase.from("tasks").select("*"),
    supabase.from("task_assignees").select("*"),
    supabase.from("task_submissions").select("*")
  ]);
  const errors = [members, departments, events, finance, outreach, applications, notifications, attendance, audit, chat, tasks, assignees, submissions].map((r) => r.error).filter(Boolean);
  if (errors[0]) throw errors[0];

  const users: User[] = (members.data || []).map((m: any) => ({
    id: m.id,
    username: m.username,
    memberId: m.member_id,
    specialNumber: m.special_number,
    name: m.name,
    email: m.email,
    phone: m.phone || "",
    role: m.role,
    position: m.position,
    department: (departments.data || []).find((d: any) => d.id === m.department_id)?.name || "General",
    skills: [],
    joinDate: m.join_date,
    avatar: "teal",
    points: m.points,
    attendance: Number(m.attendance),
    performanceScore: Number(m.performance_score),
    status: m.status,
    certificates: [],
    activity: [],
    createdBy: m.created_by || undefined,
    createdAt: m.created_at,
    lastLogin: m.last_login || undefined,
  }));
  const tasksMapped: Task[] = (tasks.data || []).map((t: any) => {
    const sub = (submissions.data || []).find((s: any) => s.task_id === t.id);
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      assignees: (assignees.data || []).filter((a: any) => a.task_id === t.id).map((a: any) => a.member_id),
      createdBy: t.created_by || "",
      createdAt: t.created_at,
      deadline: t.deadline,
      priority: t.priority,
      status: t.status,
      remarks: t.remarks || undefined,
      reviewNotes: t.review_notes || undefined,
      approvedBy: t.approved_by || undefined,
      submission: sub ? { fileName: sub.file_name, fileData: sub.file_url, fileType: sub.file_type, notes: sub.comments || "", submittedAt: sub.submitted_at } : undefined,
    };
  });
  return {
    users,
    departments: (departments.data || []).map((d: any) => ({ id: d.id, name: d.name, description: d.description, leadId: d.lead_id || undefined, createdAt: d.created_at })),
    events: (events.data || []).map((e: any) => ({ id: e.id, title: e.title, description: e.description, date: e.event_date, location: e.venue, capacity: e.capacity, registered: e.registered, attended: e.attended, status: e.status, feedback: [], budget: Number(e.budget), expense: Number(e.expense), income: Number(e.income) })),
    finance: (finance.data || []).map((f: any) => ({ id: f.id, type: f.type, amount: Number(f.amount), description: f.description, category: f.category, eventId: f.event_id || undefined, date: f.entry_date })),
    outreach: (outreach.data || []).map((o: any) => ({ id: o.id, name: o.contact_name, organization: o.organization, type: o.type, email: o.email || "", phone: o.phone || "", stage: o.stage, notes: o.notes, lastContact: o.last_contact || o.created_at })),
    applications: (applications.data || []).map((a: any) => ({ id: a.id, name: a.name, email: a.email, phone: a.phone || "", position: a.position, stage: a.stage, appliedAt: a.applied_at, notes: a.notes, score: a.score || undefined })),
    notifications: (notifications.data || []).map((n: any) => ({ id: n.id, userId: n.member_id || undefined, title: n.title, body: n.body, channel: n.channel, type: n.type, read: n.read, createdAt: n.created_at })),
    attendance: (attendance.data || []).map((a: any) => ({ id: a.id, userId: a.member_id, eventId: a.event_id || undefined, method: a.method, status: a.status, date: a.created_at })),
    activityLogs: (audit.data || []).map((l: any) => ({ id: l.id, actorId: l.actor_id || "", actorName: l.actor_name, action: l.action, target: l.target || undefined, category: l.category, createdAt: l.created_at })),
    chats: (chat.data || []).map((c: any) => ({ id: c.id, fromId: c.from_member_id, toId: c.to_member_id || undefined, team: c.team || undefined, body: c.body, read: c.read, createdAt: c.created_at })),
    tasks: tasksMapped,
    templates: [],
  };
}

export async function saveErpState(data: ErpStateSnapshot): Promise<void> {
  if (!isSupabaseConfigured) return;
  const departments = data.departments.map((d) => ({ ...(isUuid(d.id) ? { id: d.id } : {}), name: d.name, description: d.description, lead_id: isUuid(d.leadId) ? d.leadId : null }));
  if (departments.length) await supabase.from("departments").upsert(departments, { onConflict: "name" });
  const { data: dbDeps } = await supabase.from("departments").select("id,name");
  const depId = (name: string) => (dbDeps || []).find((d: any) => d.name === name)?.id || null;
  const members = data.users.map((u) => ({ ...(isUuid(u.id) ? { id: u.id } : {}), username: u.username, member_id: u.memberId, special_number: u.specialNumber, name: u.name, email: u.email, phone: u.phone || null, role: u.role, department_id: depId(u.department), position: u.position, join_date: u.joinDate, attendance: u.attendance, points: u.points, performance_score: u.performanceScore, status: u.status, created_by: isUuid(u.createdBy) ? u.createdBy : null, created_at: u.createdAt || new Date().toISOString(), last_login: u.lastLogin || null }));
  if (members.length) await supabase.from("members").upsert(members, { onConflict: "email" });
  const events = data.events.map((e) => ({ ...(isUuid(e.id) ? { id: e.id } : {}), title: e.title, description: e.description, event_date: e.date, venue: e.location, capacity: e.capacity, registered: e.registered, attended: e.attended, status: e.status, budget: e.budget, expense: e.expense, income: e.income }));
  if (events.length) await supabase.from("events").upsert(events);
  const finance = data.finance.map((f) => ({ ...(isUuid(f.id) ? { id: f.id } : {}), type: f.type, amount: f.amount, description: f.description, category: f.category, event_id: isUuid(f.eventId) ? f.eventId : null, entry_date: f.date }));
  if (finance.length) await supabase.from("finance_entries").upsert(finance);
}

export async function uploadToSupabaseStorage(path: string, file: File) {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured");
  const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function callSupabaseAdmin(action: string, payload: Record<string, unknown>) {
  const response = await fetch("/api/supabase/admin-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(json.error || "Supabase admin function failed");
  return json;
}