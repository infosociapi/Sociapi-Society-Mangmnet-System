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
import { callSupabaseAdmin, loadErpState, saveErpState } from "../lib/supabaseStore";
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from "../lib/supabase";

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

  markAttendance: (userId: string, method: AttendanceRecord["method"], status: AttendanceRecord["status"], eventId?: string) => { ok: boolean; duplicate?: boolean };

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
  "Leadership", "Human Resources", "Outreach", "Media", "Women's Wing", "Decor", "Design", "Administration", "Projects", "Events", "Technical", "Operations", "Finance"
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
      const u = state.users.find((x) => x.email.toLowerCase() === email.toLowerCase() || x.username.toLowerCase() === email.toLowerCase());
      if (!u) return { ok: false, error: "No account found for that email." };
      if (u.status === "Suspended") return { ok: false, error: "This account is suspended. Contact the Super Admin." };
      if (!isSupabaseConfigured) return { ok: false, error: supabaseConfigMessage };
      const { error } = await supabase.auth.signInWithPassword({ email: u.email, password });
      if (error) return { ok: false, error: `Supabase Auth failed: ${error.message}` };
      setCurrentUser(u);
      setState((s) => ({ ...s, users: s.users.map((x) => (x.id === u.id ? { ...x, lastLogin: new Date().toISOString() } : x)) }));
      _log(u, `Signed in`, "auth");
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
      try {
        await callSupabaseAdmin("create", {
          email: newUser.email,
          password: data.password,
          metadata: { username: newUser.username, role: newUser.role, memberId: newUser.memberId },
        });
        await supabase.auth.signInWithPassword({ email: newUser.email, password: data.password });
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Supabase account creation failed" };
      }
      setState((s) => ({ ...s, users: [...s.users, newUser] }));
      setCurrentUser(newUser);
      _log(newUser, `Registered new account`, "auth");
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
        if (!tempPassword) throw new Error("temporaryPassword is required to create Supabase Auth user");
        callSupabaseAdmin("create", {
          email: newUser.email,
          password: tempPassword,
          metadata: { username: newUser.username, role: newUser.role, memberId: newUser.memberId },
        }).catch((error) => console.error("Supabase Auth create failed", error));
      }
      _log(currentUser, `Added member ${newUser.name}`, "members", newUser.id);
      return { ...s, users: [...s.users, newUser] };
    });
  const updateUser: AppState["updateUser"] = (id, patch) => {
    setState((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
    if (currentUser?.id === id) setCurrentUser((cu) => (cu ? { ...cu, ...patch } : cu));
    _log(currentUser, `Updated member`, "members", id);
  };
  const deleteUser: AppState["deleteUser"] = (id) => {
    const user = state.users.find((u) => u.id === id);
    if (isSupabaseConfigured && user) callSupabaseAdmin("delete", { email: user.email }).catch((error) => console.error("Supabase Auth delete failed", error));
    setState((s) => ({ ...s, users: s.users.filter((u) => u.id !== id) }));
    _log(currentUser, `Deleted member`, "members", id);
  };
  const suspendUser: AppState["suspendUser"] = (id) => {
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
    _log(currentUser, `Created department ${name}`, "settings", dep.id);
  };
  const updateDepartment: AppState["updateDepartment"] = (id, patch) => {
    setState((s) => ({ ...s, departments: s.departments.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
    _log(currentUser, `Updated department`, "settings", id);
  };
  const deleteDepartment: AppState["deleteDepartment"] = (id) => {
    setState((s) => ({ ...s, departments: s.departments.filter((d) => d.id !== id) }));
    _log(currentUser, `Deleted department`, "settings", id);
  };
  const sendChat: AppState["sendChat"] = (body, toId, team) => {
    if (!currentUser || !body.trim()) return;
    const msg: ChatMessage = { id: "chat" + Date.now(), fromId: currentUser.id, toId, team, body, createdAt: new Date().toISOString(), read: false };
    setState((s) => ({ ...s, chats: [...s.chats, msg] }));
    _log(currentUser, `Sent chat message`, "comms", toId || team);
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

  const addEvent: AppState["addEvent"] = (e) => {
    const newE: Event = { ...e, id: "e" + Date.now() };
    setState((s) => ({ ...s, events: [...s.events, newE] }));
    _log(currentUser, `Created event "${newE.title}"`, "events", newE.id);
  };
  const updateEvent: AppState["updateEvent"] = (id, patch) => {
    setState((s) => ({ ...s, events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
    _log(currentUser, `Updated event`, "events", id);
  };
  const deleteEvent: AppState["deleteEvent"] = (id) => {
    setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }));
    _log(currentUser, `Deleted event`, "events", id);
  };
  const duplicateEvent: AppState["duplicateEvent"] = (id) => {
    setState((s) => {
      const e = s.events.find((x) => x.id === id);
      if (!e) return s;
      const dup: Event = { ...e, id: "e" + Date.now(), title: e.title + " (Copy)", status: "Upcoming", attended: 0, registered: 0, feedback: [], expense: 0, income: 0 };
      return { ...s, events: [...s.events, dup] };
    });
    _log(currentUser, `Duplicated event`, "events", id);
  };
  const archiveEvent: AppState["archiveEvent"] = (id) => {
    setState((s) => ({ ...s, events: s.events.map((e) => (e.id === id ? { ...e, status: "Archived" } : e)) }));
    _log(currentUser, `Archived event`, "events", id);
  };

  const addFinance: AppState["addFinance"] = (f) => {
    setState((s) => ({ ...s, finance: [{ ...f, id: "f" + Date.now() }, ...s.finance] }));
    _log(currentUser, `Added finance entry: ${f.type} PKR ${f.amount}`, "finance");
  };
  const updateFinance: AppState["updateFinance"] = (id, patch) => {
    setState((s) => ({ ...s, finance: s.finance.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
    _log(currentUser, `Edited finance entry`, "finance", id);
  };
  const deleteFinance: AppState["deleteFinance"] = (id) => {
    setState((s) => ({ ...s, finance: s.finance.filter((f) => f.id !== id) }));
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
  const markAttendance: AppState["markAttendance"] = (userId, method, status, eventId) => {
    let duplicate = false;
    const todayStr = new Date().toDateString();
    setState((s) => {
      const exists = s.attendance.find(
        (a) => a.userId === userId && new Date(a.date).toDateString() === todayStr && (eventId ? a.eventId === eventId : !a.eventId)
      );
      if (exists) {
        duplicate = true;
        return s;
      }
      const rec: AttendanceRecord = { id: "att-" + Date.now() + Math.random(), userId, date: new Date().toISOString(), method, status, eventId };
      const points = status === "Present" ? 5 : status === "Late" ? 2 : 0;
      // recompute attendance % per user across all recs
      const allRecs = [rec, ...s.attendance];
      const recompute = (u: User) => {
        const mine = allRecs.filter((a) => a.userId === u.id);
        if (mine.length === 0) return 0;
        const present = mine.filter((m) => m.status === "Present").length;
        return Math.round((present / mine.length) * 100);
      };
      const users = s.users.map((u) =>
        u.id === userId
          ? {
              ...u,
              points: u.points + points,
              performanceScore: Math.min(100, Math.round((recompute(u) * 0.6) + ((u.points + points) / 10) * 0.4)),
              attendance: recompute(u),
              activity: [{ date: rec.date, action: `Attendance marked (${method}, ${status})${eventId ? " for event" : ""}` }, ...u.activity].slice(0, 50),
            }
          : { ...u, attendance: recompute(u) }
      );
      return { ...s, attendance: allRecs, users };
    });
    if (!duplicate) _log(currentUser, `Marked attendance for member`, "attendance", userId);
    return { ok: !duplicate, duplicate };
  };

  const hasPermission = useCallback(
    (perm: Permission) => {
      if (!currentUser) return false;
      return rolePermissions[currentUser.role].includes(perm);
    },
    [currentUser]
  );

  const isSuperAdmin = useCallback(() => currentUser?.role === "Super Admin", [currentUser]);

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
