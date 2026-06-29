import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
  Role,
  Task,
  User,
} from "../types";
import {
  seedActivityLogs,
  seedApplications,
  seedAttendance,
  seedEvents,
  seedFinance,
  seedNotifications,
  seedOutreach,
  seedTasks,
  seedTemplates,
  seedUsers,
} from "../data/seed";
import {
  callSupabaseAdmin,
  clearChatThread,
  deleteChatMessage,
  deleteDepartmentRow,
  deleteEventRow,
  deleteFinanceRow,
  deleteMemberRow,
  ensureMember,
  insertChatMessage,
  insertDepartment,
  insertEvent,
  insertFinance,
  loadAttendance,
  loadChats,
  loadDepartments,
  loadErpState,
  loadEvents,
  loadFinance,
  loadMembers,
  saveErpState,
  updateDepartmentRow,
  updateEventRow,
  updateFinanceRow,
  updateMemberRow,
  upsertAttendanceRecord,
} from "../lib/supabaseStore";
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from "../lib/supabase";
import { isSuperAdminEmail } from "../lib/access";

interface AppState {
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
  currentUser: User | null;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  register: (data: Partial<User> & { password: string }) => Promise<{ ok: boolean; error?: string }>;
  forgotPassword: (email: string) => { ok: boolean; token?: string; error?: string };
  resetPassword: (token: string, newPassword: string) => { ok: boolean; error?: string };
  changePassword: (oldPw: string, newPw: string) => Promise<{ ok: boolean; error?: string }>;

  addUser: (u: Omit<User, "id" | "memberId">) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;
  suspendUser: (id: string) => void;
  resetUserPassword: (id: string, newPassword: string) => void;

  addDepartment: (name: string, description: string, leadId?: string) => void;
  updateDepartment: (id: string, patch: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  sendChat: (body: string, toId?: string, team?: string) => void;
  deleteChat: (id: string) => void;
  clearChat: (opts: { team?: string; otherId?: string }) => void;

  addTask: (t: Omit<Task, "id" | "createdAt" | "status">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  addEvent: (e: Omit<Event, "id">) => void;
  updateEvent: (id: string, patch: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  duplicateEvent: (id: string) => void;
  archiveEvent: (id: string) => void;

  addFinance: (f: Omit<FinanceEntry, "id">) => void;
  updateFinance: (id: string, patch: Partial<FinanceEntry>) => void;
  deleteFinance: (id: string) => void;

  addOutreach: (o: Omit<OutreachContact, "id">) => void;
  updateOutreach: (id: string, patch: Partial<OutreachContact>) => void;
  deleteOutreach: (id: string) => void;

  addApplication: (a: Omit<Application, "id">) => void;
  updateApplication: (id: string, patch: Partial<Application>) => void;

  addNotification: (n: Omit<NotificationItem, "id" | "createdAt" | "read">) => void;
  markAllRead: () => void;

  markAttendance: (userId: string, method: AttendanceRecord["method"], status: AttendanceRecord["status"], eventId?: string, date?: string) => { ok: boolean; duplicate?: boolean };

  logActivity: (action: string, category: ActivityLog["category"], target?: string) => void;
  hasPermission: (perm: Permission) => boolean;
  isSuperAdmin: () => boolean;
}

export type Permission =
  | "manage_members"
  | "manage_tasks"
  | "manage_finance"
  | "manage_outreach"
  | "manage_events"
  | "manage_hr"
  | "send_broadcast"
  | "view_analytics"
  | "ai_command"
  | "manage_roles"
  | "manage_settings"
  | "view_logs";

const ALL: Permission[] = [
  "manage_members", "manage_tasks", "manage_finance", "manage_outreach",
  "manage_events", "manage_hr", "send_broadcast", "view_analytics",
  "ai_command", "manage_roles", "manage_settings", "view_logs",
];

const rolePermissions: Record<Role, Permission[]> = {
  "Super Admin": ALL,
  Founder: ALL,
  "Co-Founder": ["manage_members", "manage_tasks", "manage_finance", "manage_outreach", "manage_events", "manage_hr", "send_broadcast", "view_analytics", "ai_command", "view_logs"],
  Executive: ["manage_tasks", "manage_events", "view_analytics", "send_broadcast"],
  "HR Manager": ["manage_members", "manage_hr", "view_analytics", "send_broadcast"],
  "Department Lead": ["manage_tasks", "view_analytics"],
  "Finance Manager": ["manage_finance", "view_analytics"],
  "Outreach Manager": ["manage_outreach", "view_analytics", "send_broadcast"],
  "Event Manager": ["manage_events", "view_analytics"],
  "General Member": [],
};

const Ctx = createContext<AppState | null>(null);

interface PersistShape {
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

const defaultDepartments: Department[] = [
  "Presidency",
  "Human Resources (HR)",
  "Outreach",
  "Video Editing",
  "Women's Affairs",
  "Decor",
  "Graphics",
  "Media",
  "Technical",
  "Projects",
  "Events",
  "Organizing",
  "Secretariat",
  "Logistic",
].map((name, i) => ({ id: `d${i + 1}`, name, description: `${name} department`, createdAt: new Date().toISOString() }));

function defaultState(): PersistShape {
  return {
    users: seedUsers,
    tasks: seedTasks,
    events: seedEvents,
    finance: seedFinance,
    outreach: seedOutreach,
    applications: seedApplications,
    templates: seedTemplates,
    notifications: seedNotifications,
    attendance: seedAttendance,
    activityLogs: seedActivityLogs,
    departments: defaultDepartments,
    chats: [],
  };
}

const resetTokens = new Map<string, string>();

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistShape>(defaultState);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await loadErpState().catch(() => null);
      const next = stored || defaultState();
      const { data: authData } = isSupabaseConfigured ? await supabase.auth.getSession() : { data: { session: null } } as any;
      if (!active) return;
      setState(next);
      const email = authData.session?.user?.email;
      if (email) setCurrentUser(next.users.find((u: User) => u.email.toLowerCase() === email.toLowerCase()) || null);
      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) saveErpState(state).catch((error) => console.error("Supabase save failed", error));
  }, [state, hydrated]);

  // Live sync: every few seconds pull latest members + chats from Supabase so new
  // accounts and messages appear for everyone without a manual refresh.
  useEffect(() => {
    if (!hydrated || !isSupabaseConfigured || !currentUser) return;
    let active = true;
    const tick = async () => {
      try {
        const [members, chats, events, finance, departments, attendance] = await Promise.all([
          loadMembers(),
          loadChats(),
          loadEvents(),
          loadFinance(),
          loadDepartments(),
          loadAttendance(),
        ]);
        if (!active) return;
        setState((s) => ({
          ...s,
          users: members.length ? members : s.users,
          chats,
          events,
          finance,
          departments: departments.length ? departments : s.departments,
          attendance,
        }));
      } catch (error) {
        console.error("Live sync failed", error);
      }
    };
    const interval = setInterval(tick, 6000);
    tick();
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [hydrated, currentUser]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = useCallback((t: "light" | "dark") => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState((t) => (t === "dark" ? "light" : "dark")), []);

  const _log = useCallback((actor: User | null, action: string, category: ActivityLog["category"], target?: string) => {
    if (!actor) return;
    const entry: ActivityLog = {
      id: "log" + Date.now() + Math.random(),
      actorId: actor.id,
      actorName: actor.name,
      action,
      category,
      target,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, activityLogs: [entry, ...s.activityLogs].slice(0, 500) }));
  }, []);

  const logActivity = useCallback(
    (action: string, category: ActivityLog["category"], target?: string) => _log(currentUser, action, category, target),
    [currentUser, _log]
  );

  // === Auth ===
  const login = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured) return { ok: false, error: supabaseConfigMessage };

      // Allow login by username OR email. Resolve username -> email from the members list if possible.
      const local = state.users.find(
        (x) => x.email.toLowerCase() === email.toLowerCase() || x.username.toLowerCase() === email.toLowerCase()
      );
      const loginEmail = local?.email || email;

      if (local && local.status === "Suspended") {
        return { ok: false, error: "This account is suspended. Contact the Super Admin." };
      }

      // Authenticate directly against Supabase Auth (source of truth).
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) return { ok: false, error: `Supabase Auth failed: ${error.message}` };

      const authEmail = data.user?.email || loginEmail;
      // ONLY the hardcoded Super Admin email can be Super Admin.
      const isSuper = isSuperAdminEmail(authEmail);

      // Ensure a canonical row exists in the Supabase `members` table and use its real id.
      let profile = await ensureMember({
        email: authEmail,
        name: local?.name || authEmail.split("@")[0],
        username: local?.username || authEmail.split("@")[0],
        role: isSuper ? "Super Admin" : (local?.role && local.role !== "Super Admin" ? local.role : "General Member"),
        specialNumber: local?.specialNumber,
      });

      if (!profile) {
        return { ok: false, error: "Login succeeded but member profile could not be created in Supabase. Check RLS policies on the members table." };
      }

      // Enforce the single Super Admin rule.
      if (isSuper && profile.role !== "Super Admin") {
        updateUser(profile.id, { role: "Super Admin" });
        profile = { ...profile, role: "Super Admin" };
      } else if (!isSuper && profile.role === "Super Admin") {
        // Someone other than Zuhair must never keep Super Admin.
        updateUser(profile.id, { role: "General Member" });
        profile = { ...profile, role: "General Member" };
      }

      // Refresh full member list so this user (and Super Admin) sees everyone.
      const members = await loadMembers();
      setState((s) => ({ ...s, users: members.length ? members : [...s.users, profile] }));
      setCurrentUser(profile);
      _log(profile, `Signed in`, "auth");
      return { ok: true };
    },
    [state.users, _log]
  );

  const logout = useCallback(() => {
    if (currentUser) _log(currentUser, "Signed out", "auth");
    if (isSupabaseConfigured) supabase.auth.signOut();
    setCurrentUser(null);
  }, [currentUser, _log]);

  const register = useCallback(
    async (data: Partial<User> & { password: string }) => {
      if (!data.email || !data.name) return { ok: false, error: "Missing fields." };
      if (state.users.some((u) => u.email.toLowerCase() === data.email!.toLowerCase()))
        return { ok: false, error: "Email already registered." };
      const id = "u" + (state.users.length + 1) + "-" + Date.now();
      const num = state.users.length + 1;
      const newUser: User = {
        id,
        username: data.username || data.email.split("@")[0],
        memberId: `SOC-2026-${String(num).padStart(4, "0")}`,
        specialNumber: data.specialNumber || `SM_${26200 + num}`,
        name: data.name,
        email: data.email,
        createdBy: "self-registration",
        createdAt: new Date().toISOString(),
        passwordResetHistory: [],
        role: data.role || "General Member",
        position: data.position || "Member",
        department: data.department || "General",
        skills: data.skills || [],
        joinDate: new Date().toISOString(),
        // INITIAL RULE
        points: 0,
        attendance: 0,
        performanceScore: 0,
        status: "Active",
        certificates: [],
        activity: [{ date: new Date().toISOString(), action: "Joined Sociapi Nexus" }],
        avatar: "teal",
        phone: data.phone,
      };
      if (!isSupabaseConfigured) return { ok: false, error: "Supabase is not configured." };

      // Client-side sign up works both locally and on Vercel (no serverless function needed).
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newUser.email,
        password: data.password,
        options: {
          data: { username: newUser.username, role: newUser.role, memberId: newUser.memberId },
        },
      });
      if (signUpError) return { ok: false, error: signUpError.message };

      // Create the canonical members row (so Super Admin sees them too).
      const profile = await ensureMember({
        email: newUser.email,
        name: newUser.name,
        username: newUser.username,
        role: newUser.role,
        specialNumber: newUser.specialNumber,
      });

      // If Supabase has "Confirm email" ON, there is no active session yet.
      if (!signUpData.session) {
        const members = await loadMembers();
        setState((s) => ({ ...s, users: members.length ? members : [...s.users, newUser] }));
        return {
          ok: false,
          error: "Account created, but email confirmation is required. Confirm the email in Supabase (or disable 'Confirm email' under Authentication → Providers) and then sign in.",
        };
      }

      const members = await loadMembers();
      setState((s) => ({ ...s, users: members.length ? members : [...s.users, newUser] }));
      setCurrentUser(profile || newUser);
      _log(profile || newUser, `Registered new account`, "auth");
      return { ok: true };
    },
    [state.users, _log]
  );

  const forgotPassword = useCallback(
    (email: string) => {
      const u = state.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
      if (!u) return { ok: false, error: "No account found for that email." };
      const token = Math.random().toString(36).slice(2, 10).toUpperCase();
      resetTokens.set(token, u.email);
      return { ok: true, token };
    },
    [state.users]
  );

  const resetPassword = useCallback((token: string, newPassword: string) => {
    void newPassword;
    const email = resetTokens.get(token);
    if (!email) return { ok: false, error: "Invalid or expired token." };
    setState((s) => ({
      ...s,
      users: s.users,
    }));
    resetTokens.delete(token);
    return { ok: true };
  }, []);

  const changePassword = useCallback(
    async (oldPw: string, newPw: string) => {
      if (!currentUser) return { ok: false, error: "Not signed in." };
      void oldPw;
      if (!isSupabaseConfigured) return { ok: false, error: "Supabase is not configured." };
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) return { ok: false, error: error.message };
      _log(currentUser, "Changed password", "auth");
      return { ok: true };
    },
    [currentUser, _log]
  );

  // === CRUD ===
  const addUser: AppState["addUser"] = (u) =>
    setState((s) => {
      const num = s.users.length + 1;
      const newUser: User = {
        ...u,
        id: "u" + Date.now(),
        username: u.username || u.email.split("@")[0],
        memberId: `SOC-2026-${String(num).padStart(4, "0")}`,
        createdBy: currentUser?.id,
        createdAt: new Date().toISOString(),
        passwordResetHistory: [],
        // enforce initial rule for newly added members
        points: 0,
        attendance: 0,
        performanceScore: 0,
        status: "Active",
        certificates: u.certificates || [],
        activity: u.activity?.length ? u.activity : [{ date: new Date().toISOString(), action: "Added to Sociapi Nexus" }],
      };
      if (isSupabaseConfigured) {
        const tempPassword = (u as any).temporaryPassword;
        if (!tempPassword) {
          setTimeout(() => {
            addNotification({
              title: "Member added without login",
              body: `${newUser.name} was added, but no temporary password was provided, so no Supabase Auth login was created.`,
              channel: "In-App",
              type: "warning",
            });
          }, 0);
        } else {
          callSupabaseAdmin("create", {
            email: newUser.email,
            password: tempPassword,
            metadata: { username: newUser.username, role: newUser.role, memberId: newUser.memberId },
          })
            .then(() => {
              addNotification({
                title: "Login created",
                body: `Supabase Auth login created for ${newUser.email}. They can sign in with the temporary password.`,
                channel: "In-App",
                type: "success",
              });
            })
            .catch((error) => {
              addNotification({
                title: "Supabase Auth create FAILED",
                body: `${error instanceof Error ? error.message : "Unknown error"}. Note: the admin function only runs on Vercel deployment, not on local 'npm run dev'.`,
                channel: "In-App",
                type: "alert",
              });
            });
        }
      }
      _log(currentUser, `Added member ${newUser.name}`, "members", newUser.id);
      return { ...s, users: [...s.users, newUser] };
    });
  const updateUser: AppState["updateUser"] = (id, patch) => {
    const depId = state.departments.find((d) => d.name === patch.department)?.id || null;
    setState((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
    if (currentUser?.id === id) setCurrentUser((cu) => (cu ? { ...cu, ...patch } : cu));
    if (isSupabaseConfigured) updateMemberRow(id, patch, depId).catch((error) => console.error("Member update failed", error));
    _log(currentUser, `Updated member`, "members", id);
  };
  const deleteUser: AppState["deleteUser"] = (id) => {
    const user = state.users.find((u) => u.id === id);
    if (user?.role === "Super Admin") return; // Super Admin can never be deleted.
    // Remove from members table immediately so it disappears for everyone.
    if (isSupabaseConfigured && user) {
      deleteMemberRow(id).catch((error) => console.error("Member delete failed", error));
      // Best-effort: also remove the Supabase Auth login (Vercel-only function).
      callSupabaseAdmin("delete", { email: user.email }).catch(() => {});
    }
    setState((s) => ({ ...s, users: s.users.filter((u) => u.id !== id) }));
    _log(currentUser, `Deleted member`, "members", id);
  };
  const suspendUser: AppState["suspendUser"] = (id) => {
    const target = state.users.find((u) => u.id === id);
    if (target?.role === "Super Admin") return; // Super Admin can never be suspended.
    setState((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, status: u.status === "Suspended" ? "Active" : "Suspended" } : u)) }));
    _log(currentUser, `Suspended/reactivated account`, "members", id);
  };
  const resetUserPassword: AppState["resetUserPassword"] = (id, newPassword) => {
    const user = state.users.find((u) => u.id === id);
    if (isSupabaseConfigured && user) callSupabaseAdmin("reset-password", { email: user.email, password: newPassword }).catch((error) => console.error("Supabase Auth reset failed", error));
    setState((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, passwordResetHistory: [...(u.passwordResetHistory || []), { by: currentUser?.id || "system", at: new Date().toISOString() }] } : u)) }));
    _log(currentUser, `Reset password for account`, "auth", id);
  };

  const addDepartment: AppState["addDepartment"] = (name, description, leadId) => {
    const dep: Department = { id: "d" + Date.now(), name, description, leadId, createdAt: new Date().toISOString() };
    setState((s) => ({ ...s, departments: [...s.departments, dep] }));
    insertDepartment(name, description, leadId).then(() => loadDepartments().then((departments) => setState((s) => ({ ...s, departments })))).catch((e) => console.error("Department create failed", e));
    _log(currentUser, `Created department ${name}`, "settings", dep.id);
  };
  const updateDepartment: AppState["updateDepartment"] = (id, patch) => {
    setState((s) => ({ ...s, departments: s.departments.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
    updateDepartmentRow(id, patch).then(() => loadDepartments().then((departments) => setState((s) => ({ ...s, departments })))).catch((e) => console.error("Department update failed", e));
    _log(currentUser, `Updated department`, "settings", id);
  };
  const deleteDepartment: AppState["deleteDepartment"] = (id) => {
    setState((s) => ({ ...s, departments: s.departments.filter((d) => d.id !== id) }));
    deleteDepartmentRow(id).then(() => loadDepartments().then((departments) => setState((s) => ({ ...s, departments })))).catch((e) => console.error("Department delete failed", e));
    _log(currentUser, `Deleted department`, "settings", id);
  };
  const sendChat: AppState["sendChat"] = (body, toId, team) => {
    if (!currentUser || !body.trim()) return;
    const msg: ChatMessage = { id: "chat" + Date.now(), fromId: currentUser.id, toId, team, body, createdAt: new Date().toISOString(), read: false };
    setState((s) => ({ ...s, chats: [...s.chats, msg] }));
    // Persist to Supabase so other members see it, then refresh from DB.
    insertChatMessage({ fromId: currentUser.id, toId, team, body })
      .then(async () => {
        const chats = await loadChats();
        setState((s) => ({ ...s, chats }));
      })
      .catch((error) => console.error("Chat send failed", error));
    _log(currentUser, `Sent chat message`, "comms", toId || team);
  };
  const deleteChat: AppState["deleteChat"] = (id) => {
    setState((s) => ({ ...s, chats: s.chats.filter((c) => c.id !== id) }));
    deleteChatMessage(id)
      .then(async () => {
        const chats = await loadChats();
        setState((s) => ({ ...s, chats }));
      })
      .catch((error) => console.error("Chat delete failed", error));
  };
  const clearChat: AppState["clearChat"] = ({ team, otherId }) => {
    if (!currentUser) return;
    setState((s) => ({
      ...s,
      chats: s.chats.filter((c) => {
        if (team) return c.team !== team;
        if (otherId) return !((c.fromId === currentUser.id && c.toId === otherId) || (c.fromId === otherId && c.toId === currentUser.id));
        return true;
      }),
    }));
    clearChatThread({ team, a: currentUser.id, b: otherId })
      .then(async () => {
        const chats = await loadChats();
        setState((s) => ({ ...s, chats }));
      })
      .catch((error) => console.error("Chat clear failed", error));
  };

  const addTask: AppState["addTask"] = (t) => {
    const newT: Task = { ...t, id: "t" + Date.now(), createdAt: new Date().toISOString(), status: "Assigned" };
    setState((s) => ({ ...s, tasks: [...s.tasks, newT] }));
    _log(currentUser, `Created task "${newT.title}"`, "tasks", newT.id);
  };
  const updateTask: AppState["updateTask"] = (id, patch) => {
    let snap: Task | null = null;
    setState((s) => {
      const tasks = s.tasks.map((t) => {
        if (t.id === id) {
          const next = { ...t, ...patch };
          snap = next;
          return next;
        }
        return t;
      });
      // points logic on completion
      let users = s.users;
      if (patch.status === "Completed" && snap) {
        const award = 10;
        const ids = snap.assignees;
        users = s.users.map((u) =>
          ids.includes(u.id)
            ? {
                ...u,
                points: u.points + award,
                performanceScore: Math.min(100, u.performanceScore + 10),
                activity: [{ date: new Date().toISOString(), action: `Earned +${award} for completing "${snap!.title}"` }, ...u.activity].slice(0, 50),
              }
            : u
        );
      }
      return { ...s, tasks, users };
    });
    _log(currentUser, `Updated task`, "tasks", id);
  };
  const deleteTask: AppState["deleteTask"] = (id) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
    _log(currentUser, `Deleted task`, "tasks", id);
  };

  const refreshEvents = () => loadEvents().then((events) => setState((s) => ({ ...s, events }))).catch((e) => console.error(e));
  const refreshFinance = () => loadFinance().then((finance) => setState((s) => ({ ...s, finance }))).catch((e) => console.error(e));

  const addEvent: AppState["addEvent"] = (e) => {
    const newE: Event = { ...e, id: "e" + Date.now() };
    setState((s) => ({ ...s, events: [...s.events, newE] }));
    insertEvent(newE).then(refreshEvents).catch((err) => console.error("Event create failed", err));
    _log(currentUser, `Created event "${newE.title}"`, "events", newE.id);
  };
  const updateEvent: AppState["updateEvent"] = (id, patch) => {
    let updated: Event | undefined;
    setState((s) => {
      const events = s.events.map((e) => (e.id === id ? ((updated = { ...e, ...patch }), updated) : e));
      return { ...s, events };
    });
    if (updated) updateEventRow(id, updated).then(refreshEvents).catch((err) => console.error("Event update failed", err));
    _log(currentUser, `Updated event`, "events", id);
  };
  const deleteEvent: AppState["deleteEvent"] = (id) => {
    setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }));
    deleteEventRow(id).then(refreshEvents).catch((err) => console.error("Event delete failed", err));
    _log(currentUser, `Deleted event`, "events", id);
  };
  const duplicateEvent: AppState["duplicateEvent"] = (id) => {
    const e = state.events.find((x) => x.id === id);
    if (!e) return;
    const dup: Event = { ...e, id: "e" + Date.now(), title: e.title + " (Copy)", status: "Upcoming", attended: 0, registered: 0, feedback: [], expense: 0, income: 0 };
    setState((s) => ({ ...s, events: [...s.events, dup] }));
    insertEvent(dup).then(refreshEvents).catch((err) => console.error("Event duplicate failed", err));
    _log(currentUser, `Duplicated event`, "events", id);
  };
  const archiveEvent: AppState["archiveEvent"] = (id) => {
    let updated: Event | undefined;
    setState((s) => {
      const events = s.events.map((e) => (e.id === id ? ((updated = { ...e, status: "Archived" as const }), updated) : e));
      return { ...s, events };
    });
    if (updated) updateEventRow(id, updated).then(refreshEvents).catch((err) => console.error("Event archive failed", err));
    _log(currentUser, `Archived event`, "events", id);
  };

  const addFinance: AppState["addFinance"] = (f) => {
    const newF: FinanceEntry = { ...f, id: "f" + Date.now() };
    setState((s) => ({ ...s, finance: [newF, ...s.finance] }));
    insertFinance(newF).then(refreshFinance).catch((err) => console.error("Finance create failed", err));
    _log(currentUser, `Added finance entry: ${f.type} PKR ${f.amount}`, "finance");
  };
  const updateFinance: AppState["updateFinance"] = (id, patch) => {
    let updated: FinanceEntry | undefined;
    setState((s) => {
      const finance = s.finance.map((f) => (f.id === id ? ((updated = { ...f, ...patch }), updated) : f));
      return { ...s, finance };
    });
    if (updated) updateFinanceRow(id, updated).then(refreshFinance).catch((err) => console.error("Finance update failed", err));
    _log(currentUser, `Edited finance entry`, "finance", id);
  };
  const deleteFinance: AppState["deleteFinance"] = (id) => {
    setState((s) => ({ ...s, finance: s.finance.filter((f) => f.id !== id) }));
    deleteFinanceRow(id).then(refreshFinance).catch((err) => console.error("Finance delete failed", err));
    _log(currentUser, `Deleted finance entry`, "finance", id);
  };

  const addOutreach: AppState["addOutreach"] = (o) => {
    setState((s) => ({ ...s, outreach: [...s.outreach, { ...o, id: "o" + Date.now() }] }));
    _log(currentUser, `Added outreach contact: ${o.organization}`, "outreach");
  };
  const updateOutreach: AppState["updateOutreach"] = (id, patch) => {
    setState((s) => ({ ...s, outreach: s.outreach.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
    _log(currentUser, `Updated outreach contact`, "outreach", id);
  };
  const deleteOutreach: AppState["deleteOutreach"] = (id) => {
    setState((s) => ({ ...s, outreach: s.outreach.filter((o) => o.id !== id) }));
    _log(currentUser, `Deleted outreach contact`, "outreach", id);
  };

  const addApplication: AppState["addApplication"] = (a) =>
    setState((s) => ({ ...s, applications: [...s.applications, { ...a, id: "a" + Date.now() }] }));
  const updateApplication: AppState["updateApplication"] = (id, patch) =>
    setState((s) => ({
      ...s,
      applications: s.applications.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));

  const addNotification: AppState["addNotification"] = (n) =>
    setState((s) => ({
      ...s,
      notifications: [
        { ...n, id: "n" + Date.now(), createdAt: new Date().toISOString(), read: false },
        ...s.notifications,
      ],
    }));
  const markAllRead = () =>
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));

  // attendance with dedup per day & event scope
  const markAttendance: AppState["markAttendance"] = (userId, method, status, eventId, date) => {
    let duplicate = false;
    const effectiveDate = date || new Date().toISOString();
    const dateStr = new Date(effectiveDate).toDateString();
    let latestRec: AttendanceRecord | null = null;
    setState((s) => {
      const exists = s.attendance.find(
        (a) => a.userId === userId && new Date(a.date).toDateString() === dateStr && (eventId ? a.eventId === eventId : !a.eventId)
      );
      // QR duplicates blocked, Manual/Event can update existing status for edits/backdated changes.
      let allRecs = s.attendance;
      if (exists) {
        if (method === "QR") {
          duplicate = true;
          latestRec = exists;
          return s;
        }
        latestRec = { ...exists, status, method, date: effectiveDate };
        allRecs = s.attendance.map((a) => (a.id === exists.id ? latestRec! : a));
      } else {
        latestRec = { id: "att-" + Date.now() + Math.random(), userId, date: effectiveDate, method, status, eventId };
        allRecs = [latestRec, ...s.attendance];
      }
      const recompute = (u: User) => {
        const mine = allRecs.filter((a) => a.userId === u.id);
        if (mine.length === 0) return 0;
        const present = mine.filter((m) => m.status === "Present").length;
        return Math.round((present / mine.length) * 100);
      };
      const points = status === "Present" ? 5 : status === "Late" ? 2 : 0;
      const users = s.users.map((u) =>
        u.id === userId
          ? {
              ...u,
              points: exists ? u.points : u.points + points,
              performanceScore: Math.min(100, Math.round((recompute(u) * 0.6) + (((exists ? u.points : u.points + points)) / 10) * 0.4)),
              attendance: recompute(u),
              activity: [{ date: effectiveDate, action: `Attendance marked (${method}, ${status})${eventId ? " for event" : ""}` }, ...u.activity].slice(0, 50),
            }
          : { ...u, attendance: recompute(u) }
      );
      return { ...s, attendance: allRecs, users };
    });
    if (!duplicate && latestRec) {
      void upsertAttendanceRecord(latestRec).catch((error) => console.error("Attendance save failed", error));
      _log(currentUser, `Marked attendance for member`, "attendance", userId);
    }
    return { ok: !duplicate, duplicate };
  };

  const hasPermission = useCallback(
    (perm: Permission) => {
      if (!currentUser) return false;
      return rolePermissions[currentUser.role].includes(perm);
    },
    [currentUser]
  );

  const isSuperAdmin = useCallback(() => currentUser?.role === "Super Admin" || isSuperAdminEmail(currentUser?.email), [currentUser]);

  const value = useMemo<AppState>(
    () => ({
      ...state,
      currentUser,
      theme,
      setTheme,
      toggleTheme,
      login,
      logout,
      register,
      forgotPassword,
      resetPassword,
      changePassword,
      addUser,
      updateUser,
      deleteUser,
      suspendUser,
      resetUserPassword,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      sendChat,
      deleteChat,
      clearChat,
      addTask,
      updateTask,
      deleteTask,
      addEvent,
      updateEvent,
      deleteEvent,
      duplicateEvent,
      archiveEvent,
      addFinance,
      updateFinance,
      deleteFinance,
      addOutreach,
      updateOutreach,
      deleteOutreach,
      addApplication,
      updateApplication,
      addNotification,
      markAllRead,
      markAttendance,
      logActivity,
      hasPermission,
      isSuperAdmin,
    }),
    [state, currentUser, theme, setTheme, toggleTheme, login, logout, register, forgotPassword, resetPassword, changePassword, hasPermission, isSuperAdmin, logActivity]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
