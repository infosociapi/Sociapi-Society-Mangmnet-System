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
    photoUrl: m.profile_photo_url || undefined,
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
    events: (events.data || []).map((e: any) => ({ id: e.id, title: e.title, description: e.description, type: e.type || "event", date: e.event_date, location: e.venue, capacity: e.capacity, registered: e.registered, attended: e.attended, status: e.status, feedback: [], budget: Number(e.budget), expense: Number(e.expense), income: Number(e.income) })),
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

// NOTE: events & finance are NOT bulk-saved here anymore (that caused duplicate
// rows on every state change). They use direct insert/update/delete below.
export async function saveErpState(data: ErpStateSnapshot): Promise<void> {
  if (!isSupabaseConfigured) return;
  // Only members are upserted in bulk, and email is unique so no duplicates can occur.
  const { data: dbDeps } = await supabase.from("departments").select("id,name");
  const depId = (name: string) => (dbDeps || []).find((d: any) => d.name === name)?.id || null;
  const members = data.users
    .filter((u) => isUuid(u.id))
    .map((u) => ({
      id: u.id,
      username: u.username,
      member_id: u.memberId,
      special_number: u.specialNumber,
      name: u.name,
      email: u.email,
      phone: u.phone || null,
      profile_photo_url: u.photoUrl || null,
      role: u.role,
      department_id: depId(u.department),
      position: u.position,
      attendance: u.attendance,
      points: u.points,
      performance_score: u.performanceScore,
      status: u.status,
      last_login: u.lastLogin || null,
    }));
  if (members.length) await supabase.from("members").upsert(members, { onConflict: "id" });
}

/* ===================== EVENTS (direct CRUD) ===================== */
function eventRow(e: Event) {
  return {
    title: e.title,
    description: e.description,
    type: e.type || "event",
    event_date: e.date,
    venue: e.location,
    capacity: e.capacity,
    registered: e.registered,
    attended: e.attended,
    status: e.status,
    budget: e.budget,
    expense: e.expense,
    income: e.income,
  };
}
export async function insertEvent(e: Event): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from("events").insert(eventRow(e)).select("id").maybeSingle();
  if (error) throw error;
  return data?.id || null;
}
export async function updateEventRow(id: string, e: Event) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from("events").update(eventRow(e)).eq("id", id);
  if (error) throw error;
}
export async function deleteEventRow(id: string) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function insertDepartment(name: string, description: string, leadId?: string) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("departments").insert({ name, description, lead_id: isUuid(leadId) ? leadId : null });
  if (error) throw error;
}

export async function updateDepartmentRow(id: string, patch: Partial<Department>) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from("departments").update({
    name: patch.name,
    description: patch.description,
    lead_id: isUuid(patch.leadId) ? patch.leadId : null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteDepartmentRow(id: string) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) throw error;
}

export async function loadDepartments(): Promise<Department[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("departments").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data || []).map((d: any) => ({ id: d.id, name: d.name, leadId: d.lead_id || undefined, description: d.description, createdAt: d.created_at }));
}

export async function loadEvents(): Promise<Event[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
  if (error) throw error;
  return (data || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    type: e.type || "event",
    date: e.event_date,
    location: e.venue,
    capacity: e.capacity,
    registered: e.registered,
    attended: e.attended,
    status: e.status,
    feedback: [],
    budget: Number(e.budget),
    expense: Number(e.expense),
    income: Number(e.income),
  }));
}

/* ===================== FINANCE (direct CRUD) ===================== */
function financeRow(f: FinanceEntry) {
  return {
    type: f.type,
    amount: f.amount,
    description: f.description,
    category: f.category,
    event_id: isUuid(f.eventId) ? f.eventId : null,
    entry_date: f.date,
    reference: f.reference || null,
  };
}
export async function insertFinance(f: FinanceEntry): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from("finance_entries").insert(financeRow(f)).select("id").maybeSingle();
  if (error) throw error;
  return data?.id || null;
}
export async function updateFinanceRow(id: string, f: FinanceEntry) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from("finance_entries").update(financeRow(f)).eq("id", id);
  if (error) throw error;
}
export async function deleteFinanceRow(id: string) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from("finance_entries").delete().eq("id", id);
  if (error) throw error;
}
export async function loadFinance(): Promise<FinanceEntry[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("finance_entries").select("*").order("entry_date", { ascending: false });
  if (error) throw error;
  return (data || []).map((f: any) => ({
    id: f.id,
    type: f.type,
    amount: Number(f.amount),
    description: f.description,
    category: f.category,
    eventId: f.event_id || undefined,
    date: f.entry_date,
    reference: f.reference || undefined,
  }));
}

/* ===================== ATTENDANCE (direct CRUD) ===================== */
export async function upsertAttendanceRecord(rec: AttendanceRecord) {
  if (!isSupabaseConfigured) return;
  const row = {
    member_id: rec.userId,
    event_id: isUuid(rec.eventId) ? rec.eventId : null,
    method: rec.method,
    status: rec.status,
    attendance_date: rec.date.slice(0, 10),
    created_at: rec.date,
  };
  // update existing for same member/date/event; else insert
  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("member_id", rec.userId)
    .eq("attendance_date", rec.date.slice(0, 10))
    .eq("event_id", isUuid(rec.eventId) ? rec.eventId : null)
    .maybeSingle();
  if (existing?.id) {
    const { error } = await supabase.from("attendance").update(row).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("attendance").insert(row);
    if (error) throw error;
  }
}

// Deletes a single attendance record from Supabase. Without this, deleting a
// record only removed it from local React state — the row stayed in the
// "attendance" table, so the next live-sync poll (every 6s) would re-fetch it
// and it would reappear after a page refresh.
export async function deleteAttendanceRow(id: string) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from("attendance").delete().eq("id", id);
  if (error) throw error;
}

export async function loadAttendance(): Promise<AttendanceRecord[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("attendance").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((a: any) => ({
    id: a.id,
    userId: a.member_id,
    eventId: a.event_id || undefined,
    method: a.method,
    status: a.status,
    date: a.created_at,
  }));
}

function isUuidLoose(id?: string) {
  return !!id && /^[0-9a-f-]{32,36}$/i.test(id);
}

export async function insertChatMessage(msg: { fromId: string; toId?: string; team?: string; body: string }) {
  if (!isSupabaseConfigured) return;
  const row: any = {
    from_member_id: isUuidLoose(msg.fromId) ? msg.fromId : null,
    to_member_id: msg.toId && isUuidLoose(msg.toId) ? msg.toId : null,
    team: msg.team || null,
    body: msg.body,
  };
  if (!row.from_member_id) {
    // Resolve sender member row by current session if id is not a uuid.
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    if (email) {
      const { data: m } = await supabase.from("members").select("id").eq("email", email).maybeSingle();
      row.from_member_id = m?.id || null;
    }
  }
  const { error } = await supabase.from("chat").insert(row);
  if (error) throw error;
}

export async function deleteMemberRow(id: string) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteChatMessage(id: string) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("chat").delete().eq("id", id);
  if (error) throw error;
}

export async function clearChatThread(opts: { team?: string; a?: string; b?: string }) {
  if (!isSupabaseConfigured) return;
  if (opts.team) {
    const { error } = await supabase.from("chat").delete().eq("team", opts.team);
    if (error) throw error;
    return;
  }
  if (opts.a && opts.b) {
    // delete both directions of a DM thread
    await supabase.from("chat").delete().eq("from_member_id", opts.a).eq("to_member_id", opts.b);
    await supabase.from("chat").delete().eq("from_member_id", opts.b).eq("to_member_id", opts.a);
  }
}

export async function loadChats(): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("chat").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((c: any) => ({
    id: c.id,
    fromId: c.from_member_id,
    toId: c.to_member_id || undefined,
    team: c.team || undefined,
    body: c.body,
    read: c.read,
    createdAt: c.created_at,
  }));
}

export async function loadMembers(): Promise<User[]> {
  if (!isSupabaseConfigured) return [];
  const [{ data: members }, { data: departments }] = await Promise.all([
    supabase.from("members").select("*"),
    supabase.from("departments").select("id,name"),
  ]);
  return (members || []).map((m: any) => ({
    id: m.id,
    username: m.username,
    memberId: m.member_id,
    specialNumber: m.special_number,
    name: m.name,
    email: m.email,
    photoUrl: m.profile_photo_url || undefined,
    phone: m.phone || "",
    role: m.role,
    position: m.position,
    department: (departments || []).find((d: any) => d.id === m.department_id)?.name || "General",
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
}

function mapMemberRow(m: any, departments: any[]): User {
  return {
    id: m.id,
    username: m.username,
    memberId: m.member_id,
    specialNumber: m.special_number,
    name: m.name,
    email: m.email,
    photoUrl: m.profile_photo_url || undefined,
    phone: m.phone || "",
    role: m.role,
    position: m.position,
    department: (departments || []).find((d: any) => d.id === m.department_id)?.name || "General",
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
  };
}

// Guarantees a row exists in `members` for the given auth user, and returns the
// canonical User (with the real members.id). This keeps currentUser.id aligned
// with members.id so direct messages and member lists work correctly.
export async function ensureMember(opts: {
  email: string;
  name?: string;
  username?: string;
  role?: string;
  specialNumber?: string;
}): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  const { data: departments } = await supabase.from("departments").select("id,name");

  // Already exists?
  const { data: existing } = await supabase.from("members").select("*").eq("email", opts.email).maybeSingle();
  if (existing) {
    await supabase.from("members").update({ last_login: new Date().toISOString() }).eq("id", existing.id);
    return mapMemberRow({ ...existing, last_login: new Date().toISOString() }, departments || []);
  }

  // Generate a unique member_id / special_number based on current count.
  const { count } = await supabase.from("members").select("*", { count: "exact", head: true });
  const next = (count || 0) + 1;
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  const row = {
    username: opts.username || opts.email.split("@")[0],
    member_id: `SOC-2026-${String(next).padStart(4, "0")}`,
    special_number: opts.specialNumber || `SM_${26200 + next}_${suffix}`,
    name: opts.name || opts.email.split("@")[0],
    email: opts.email,
    role: opts.role || "General Member",
    position: "Member",
    status: "Active",
    attendance: 0,
    points: 0,
    performance_score: 0,
    join_date: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
  };
  const { data: inserted, error } = await supabase.from("members").insert(row).select("*").maybeSingle();
  if (error) {
    console.error("ensureMember insert failed", error);
    return null;
  }
  return inserted ? mapMemberRow(inserted, departments || []) : null;
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

export async function updateMemberRow(id: string, member: Partial<User>, depId: string | null) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from("members").update({
    username: member.username,
    name: member.name,
    email: member.email,
    phone: member.phone,
    role: member.role,
    department_id: depId,
    position: member.position,
    status: member.status,
    profile_photo_url: member.photoUrl,
    attendance: member.attendance,
    points: member.points,
    performance_score: member.performanceScore,
  }).eq("id", id);
  if (error) throw error;
}