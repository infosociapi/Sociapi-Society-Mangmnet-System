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

/* ===================== TASKS (direct CRUD) ===================== */
function taskRow(t: Task) {
  return {
    title: t.title,
    description: t.description,
    deadline: t.deadline,
    priority: t.priority,
    status: t.status,
    created_by: isUuid(t.createdBy) ? t.createdBy : null,
    remarks: t.remarks || null,
    review_notes: t.reviewNotes || null,
    approved_by: isUuid(t.approvedBy) ? t.approvedBy : null,
  };
}

export async function insertTask(t: Task): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from("tasks").insert(taskRow(t)).select("id").maybeSingle();
  if (error) throw error;
  const taskId = data?.id || null;
  if (taskId) {
    const assigneeRows = (t.assignees || []).filter(isUuid).map((memberId) => ({ task_id: taskId, member_id: memberId }));
    if (assigneeRows.length) await supabase.from("task_assignees").insert(assigneeRows);
  }
  return taskId;
}

export async function updateTaskRow(id: string, t: Task) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from("tasks").update(taskRow(t)).eq("id", id);
  if (error) throw error;

  await supabase.from("task_assignees").delete().eq("task_id", id);
  const assigneeRows = (t.assignees || []).filter(isUuid).map((memberId) => ({ task_id: id, member_id: memberId }));
  if (assigneeRows.length) await supabase.from("task_assignees").insert(assigneeRows);

  const submitterId = assigneeRows[0]?.member_id;
  if (t.submission && submitterId) {
    const { data: existingSub } = await supabase.from("task_submissions").select("id").eq("task_id", id).maybeSingle();
    const subRow = {
      task_id: id,
      member_id: submitterId,
      file_name: t.submission.fileName,
      file_url: t.submission.fileData || null,
      file_type: t.submission.fileType || null,
      comments: t.submission.notes || "",
      submitted_at: t.submission.submittedAt,
    };
    if (existingSub?.id) await supabase.from("task_submissions").update(subRow).eq("id", existingSub.id);
    else await supabase.from("task_submissions").insert(subRow);
  }
}

export async function deleteTaskRow(id: string) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function loadTasks(): Promise<Task[]> {
  if (!isSupabaseConfigured) return [];
  const [{ data: tasks, error }, { data: assignees }, { data: submissions }] = await Promise.all([
    supabase.from("tasks").select("*").order("created_at", { ascending: false }),
    supabase.from("task_assignees").select("*"),
    supabase.from("task_submissions").select("*"),
  ]);
  if (error) throw error;
  return (tasks || []).map((t: any) => {
    const subs = (submissions || []).filter((s: any) => s.task_id === t.id);
    const sub = subs.sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      assignees: (assignees || []).filter((a: any) => a.task_id === t.id).map((a: any) => a.member_id),
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
}

/* ===================== OUTREACH (direct CRUD) ===================== */
function outreachRow(o: OutreachContact) {
  return {
    organization: o.organization,
    contact_name: o.name,
    type: o.type,
    email: o.email || null,
    phone: o.phone || null,
    stage: o.stage,
    notes: o.notes || "",
    last_contact: o.lastContact || null,
  };
}

export async function insertOutreach(o: OutreachContact): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from("outreach").insert(outreachRow(o)).select("id").maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

export async function updateOutreachRow(id: string, o: OutreachContact) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from("outreach").update(outreachRow(o)).eq("id", id);
  if (error) throw error;
}

export async function deleteOutreachRow(id: string) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from("outreach").delete().eq("id", id);
  if (error) throw error;
}

export async function loadOutreach(): Promise<OutreachContact[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("outreach").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((o: any) => ({
    id: o.id,
    name: o.contact_name,
    organization: o.organization,
    type: o.type,
    email: o.email || "",
    phone: o.phone || "",
    stage: o.stage,
    notes: o.notes,
    lastContact: o.last_contact || o.created_at,
  }));
}

/* ===================== HR APPLICATIONS (direct CRUD) ===================== */
function applicationRow(a: Application) {
  return {
    name: a.name,
    email: a.email,
    phone: a.phone || null,
    position: a.position,
    stage: a.stage,
    notes: a.notes || "",
    score: a.score ?? null,
  };
}

export async function insertApplication(a: Application): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from("hr_applications").insert(applicationRow(a)).select("id").maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

export async function updateApplicationRow(id: string, a: Application) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from("hr_applications").update(applicationRow(a)).eq("id", id);
  if (error) throw error;
}

export async function loadApplications(): Promise<Application[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("hr_applications").select("*").order("applied_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((a: any) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    phone: a.phone || "",
    position: a.position,
    stage: a.stage,
    appliedAt: a.applied_at,
    notes: a.notes,
    score: a.score || undefined,
  }));
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
  const named: [string, { data: any; error: any }][] = [
    ["members", members], ["departments", departments], ["events", events],
    ["finance_entries", finance], ["outreach", outreach], ["hr_applications", applications],
    ["notifications", notifications], ["attendance", attendance], ["audit_logs", audit],
    ["chat", chat], ["tasks", tasks], ["task_assignees", assignees], ["task_submissions", submissions],
  ];
  for (const [table, res] of named) {
    if (res.error) console.error(`loadErpState: failed to read "${table}" (RLS / permissions / wrong project?):`, res.error);
  }
  if (members.error) throw members.error;

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

/* ===================== MEMBERS (direct CRUD) ===================== */
function memberRow(u: Partial<User>, depId: string | null) {
  return {
    username: u.username,
    member_id: u.memberId,
    special_number: u.specialNumber,
    name: u.name,
    email: u.email,
    phone: u.phone || null,
    profile_photo_url: u.photoUrl || null,
    role: u.role,
    department_id: depId,
    position: u.position,
    status: u.status || "Active",
    points: u.points ?? 0,
    attendance: u.attendance ?? 0,
    performance_score: u.performanceScore ?? 0,
    join_date: u.joinDate ? u.joinDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    created_by: isUuid(u.createdBy) ? u.createdBy : null,
    created_at: new Date().toISOString(),
  };
}

export async function insertMember(u: Partial<User>, depId: string | null): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("members")
    .insert(memberRow(u, depId))
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
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
  const [membersRes, departmentsRes] = await Promise.all([
    supabase.from("members").select("*"),
    supabase.from("departments").select("id,name"),
  ]);
  if (membersRes.error) {
    console.error("loadMembers: failed to read members table (check RLS SELECT policy / project keys):", membersRes.error);
    throw membersRes.error;
  }
  if (departmentsRes.error) {
    console.error("loadMembers: failed to read departments table:", departmentsRes.error);
    throw departmentsRes.error;
  }
  const members = membersRes.data;
  const departments = departmentsRes.data;
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

  // Generate a collision-proof member_id / special_number. The previous
  // version used a `count`-based sequential number ("SOC-2026-000N"), which
  // is racy: two signups/logins happening close together (or a count that
  // went out of sync after a row was deleted) could both compute the same
  // `next` value and both try to insert the SAME member_id. The second
  // insert then hits the "members_member_id_key" unique constraint and
  // fails with a 409 Conflict. Timestamp + random suffix removes the need
  // to read a count at all, so it can't collide. We also retry once on a
  // unique-constraint error as a belt-and-suspenders safety net.
  const genRow = () => {
    const stamp = Date.now().toString(36).toUpperCase();
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return {
      username: opts.username || opts.email.split("@")[0],
      member_id: `SOC-2026-${stamp}${suffix}`,
      special_number: opts.specialNumber || `SM_${stamp}${suffix}`,
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
  };

  let { data: inserted, error } = await supabase.from("members").insert(genRow()).select("*").maybeSingle();
  if (error?.code === "23505") {
    // Extremely unlikely double-collision — regenerate and retry once.
    ({ data: inserted, error } = await supabase.from("members").insert(genRow()).select("*").maybeSingle());
  }
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