import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  CalendarDays,
  DollarSign,
  Briefcase,
  Network,
  Sparkles,
  MessageSquare,
  Trophy,
  ClipboardCheck,
  Bell,
  Search,
  Sun,
  Moon,
  LogOut,
  Settings,
  Menu,
  X,
  Home,
  IdCard,
  ScrollText,
  Building2,
  MessagesSquare,
  ServerCog,
  UserCog,
  LockKeyhole,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { useApp } from "../context/AppContext";
import { Avatar, Badge } from "../components/ui";
import { cn } from "../utils/cn";
import { getAllowedSections, type Section } from "../lib/access";

function NavGroup({ title, items, onNav }: { title: string; items: { to: string; label: string; icon: any }[]; onNav: () => void }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{title}</p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNav}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "soc-bg-soft-r text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/20"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

const personalNav: { to: string; label: string; icon: any; section: Section }[] = [
  { to: "/app/me", label: "My Dashboard", icon: Home, section: "me" },
  { to: "/app/id-card", label: "My ID Card", icon: IdCard, section: "id-card" },
];

const orgNav: { to: string; label: string; icon: any; section: Section }[] = [
  { to: "/app/dashboard", label: "Org Dashboard", icon: LayoutDashboard, section: "dashboard" },
  { to: "/app/members", label: "Members", icon: Users, section: "members" },
  { to: "/app/departments", label: "Departments", icon: Building2, section: "departments" },
  { to: "/app/tasks", label: "Tasks", icon: CheckSquare, section: "tasks" },
  { to: "/app/attendance", label: "Attendance", icon: ClipboardCheck, section: "attendance" },
  { to: "/app/events", label: "Events", icon: CalendarDays, section: "events" },
  { to: "/app/finance", label: "Finance", icon: DollarSign, section: "finance" },
  { to: "/app/hr", label: "HR", icon: Briefcase, section: "hr" },
  { to: "/app/outreach", label: "Outreach CRM", icon: Network, section: "outreach" },
  { to: "/app/leaderboard", label: "Leaderboard", icon: Trophy, section: "leaderboard" },
  { to: "/app/ai", label: "AI Command", icon: Sparkles, section: "ai" },
  { to: "/app/communications", label: "Communications", icon: MessageSquare, section: "communications" },
  { to: "/app/chat", label: "Team Chat", icon: MessagesSquare, section: "chat" },
];

const adminNav: { to: string; label: string; icon: any; section: Section }[] = [
  { to: "/app/accounts", label: "Accounts", icon: UserCog, section: "accounts" },
  { to: "/app/passwords", label: "Password Vault", icon: LockKeyhole, section: "passwords" },
  { to: "/app/logs", label: "Activity Logs", icon: ScrollText, section: "logs" },
  { to: "/app/architecture", label: "System Blueprint", icon: ServerCog, section: "architecture" },
  { to: "/app/settings", label: "Settings", icon: Settings, section: "settings" },
];

export default function DashboardLayout() {
  const { currentUser, theme, toggleTheme, logout, notifications, markAllRead } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  if (!currentUser) return null;
  const allowedSections = getAllowedSections(currentUser);
  const filter = (items: { section: Section }[]) => items.filter((i) => allowedSections.has(i.section)) as any;

  return (
    <div className="min-h-screen app-bg flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static z-40 inset-y-0 left-0 w-72 transform transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full m-3 glass-strong rounded-2xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between">
            <Logo />
            <button onClick={() => setOpen(false)} className="lg:hidden h-8 w-8 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
            <NavGroup title="Personal" items={filter(personalNav)} onNav={() => setOpen(false)} />
            <NavGroup title="Organization" items={filter(orgNav)} onNav={() => setOpen(false)} />
            <NavGroup title="Admin" items={filter(adminNav)} onNav={() => setOpen(false)} />
          </nav>
          <div className="p-3 border-t border-slate-200/60 dark:border-white/10">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-100/60 dark:bg-white/5">
              <Avatar name={currentUser.name} gradient={currentUser.avatar} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser.role}</p>
              </div>
              <button onClick={onLogout} className="h-8 w-8 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 flex items-center justify-center" title="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 px-3 lg:px-6 pt-3">
          <div className="glass-strong rounded-2xl px-4 py-3 flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden h-9 w-9 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 flex items-center justify-center">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1 relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Search members, tasks, events…"
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-white/10 outline-none text-sm"
              />
            </div>
            <button
              onClick={toggleTheme}
              className="h-10 w-10 rounded-xl hover:bg-slate-200/60 dark:hover:bg-white/10 flex items-center justify-center"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((v) => !v);
                  if (!notifOpen) setTimeout(markAllRead, 1500);
                }}
                className="h-10 w-10 rounded-xl hover:bg-slate-200/60 dark:hover:bg-white/10 flex items-center justify-center relative"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 glass-strong rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                    <p className="font-semibold text-sm">Notifications</p>
                    <Badge tone="indigo">{notifications.length}</Badge>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-200/60 dark:divide-white/5">
                    {notifications.slice(0, 8).map((n) => (
                      <div key={n.id} className="px-4 py-3 hover:bg-slate-100/60 dark:hover:bg-white/5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{n.title}</p>
                          <Badge
                            tone={n.type === "warning" ? "amber" : n.type === "success" ? "emerald" : n.type === "alert" ? "rose" : "indigo"}
                          >
                            {n.channel}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{n.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10">
              <Avatar name={currentUser.name} gradient={currentUser.avatar} size={36} />
              <div className="leading-tight">
                <p className="text-sm font-semibold">{currentUser.name.split("(")[0]}</p>
                <p className="text-xs text-slate-500">{currentUser.memberId}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
