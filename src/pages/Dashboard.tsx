import { useMemo } from "react";
import { Card, Badge, Avatar } from "../components/ui";
import { useApp } from "../context/AppContext";
import {
  Users,
  UserCheck,
  ClipboardList,
  CheckCircle2,
  CalendarDays,
  DollarSign,
  Network,
  TrendingUp,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function fmtPKR(n: number) {
  return "PKR " + n.toLocaleString();
}

export default function Dashboard() {
  const { users, tasks, events, finance, outreach, attendance, currentUser } = useApp();

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "Active").length;
    const loggedIn = users.filter((u) => u.lastLogin).length;
    const newAccounts = users.filter((u) => {
      const created = u.createdAt || u.joinDate;
      return (Date.now() - new Date(created).getTime()) / 86400000 <= 30;
    }).length;
    const totalRecs = attendance.length;
    const present = attendance.filter((a) => a.status === "Present").length;
    const rate = totalRecs ? Math.round((present / totalRecs) * 100) : 0;
    const openTasks = tasks.filter((t) => t.status !== "Completed").length;
    const doneTasks = tasks.filter((t) => t.status === "Completed").length;
    const upcoming = events.filter((e) => e.status === "Upcoming").length;
    const income = finance.filter((f) => f.type !== "Expense").reduce((s, f) => s + f.amount, 0);
    const expense = finance.filter((f) => f.type === "Expense").reduce((s, f) => s + f.amount, 0);
    const balance = income - expense;
    const partners = outreach.filter((o) => o.stage === "Partnership").length;
    return { total, active, loggedIn, newAccounts, rate, openTasks, doneTasks, upcoming, income, expense, balance, partners };
  }, [users, tasks, events, finance, outreach, attendance]);

  const attendanceTrend = useMemo(() => {
    const arr: { day: string; rate: number }[] = [];
    for (let d = 13; d >= 0; d--) {
      const day = new Date(Date.now() - d * 86400000);
      const recs = attendance.filter((a) => new Date(a.date).toDateString() === day.toDateString());
      const present = recs.filter((r) => r.status === "Present").length;
      const rate = recs.length ? Math.round((present / recs.length) * 100) : 0;
      arr.push({ day: day.toLocaleDateString("en", { weekday: "short" }), rate });
    }
    return arr;
  }, [attendance]);

  const taskBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => (map[t.status] = (map[t.status] || 0) + 1));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const financeMonthly = useMemo(() => {
    const buckets: Record<string, { month: string; income: number; expense: number }> = {};
    finance.forEach((f) => {
      const m = new Date(f.date).toLocaleDateString("en", { month: "short" });
      if (!buckets[m]) buckets[m] = { month: m, income: 0, expense: 0 };
      if (f.type === "Expense") buckets[m].expense += f.amount;
      else buckets[m].income += f.amount;
    });
    return Object.values(buckets);
  }, [finance]);

  const pieColors = ["#6366f1", "#a855f7", "#f59e0b", "#ef4444", "#10b981"];

  const recentActivity = users.flatMap((u) => u.activity.map((a) => ({ ...a, user: u }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  const loggedInUsers = users.filter((u) => u.lastLogin).sort((a, b) => new Date(b.lastLogin || 0).getTime() - new Date(a.lastLogin || 0).getTime());

  return (
    <div className="space-y-6">
      {/* Welcome hero */}
      <Card className="relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full soc-bg-soft blur-3xl" />
        <div className="relative p-6 lg:p-8">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div>
              <Badge tone="indigo" className="mb-3">{currentUser?.role}</Badge>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                Welcome back, {currentUser?.name.split(" ")[0]} 👋
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Here's what's happening at Sociapi today.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="emerald"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" /> All systems operational</Badge>
              <Badge tone="violet">{currentUser?.memberId}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={<Users className="h-5 w-5" />} label="Total Members" value={stats.total} delta="+2" tone="indigo" />
        <Kpi icon={<UserCheck className="h-5 w-5" />} label="Active Accounts" value={stats.active} delta="live" tone="emerald" />
        <Kpi icon={<Activity className="h-5 w-5" />} label="Logged In Users" value={stats.loggedIn} delta="auth" tone="sky" />
        <Kpi icon={<Users className="h-5 w-5" />} label="New Accounts" value={stats.newAccounts} delta="30d" tone="violet" />
        <Kpi icon={<Activity className="h-5 w-5" />} label="Attendance Rate" value={`${stats.rate}%`} delta="+4%" tone="sky" />
        <Kpi icon={<ClipboardList className="h-5 w-5" />} label="Open Tasks" value={stats.openTasks} delta="-2" tone="amber" />
        <Kpi icon={<CheckCircle2 className="h-5 w-5" />} label="Completed Tasks" value={stats.doneTasks} delta="+3" tone="emerald" />
        <Kpi icon={<CalendarDays className="h-5 w-5" />} label="Upcoming Events" value={stats.upcoming} delta="+1" tone="violet" />
        <Kpi icon={<DollarSign className="h-5 w-5" />} label="Balance" value={fmtPKR(stats.balance)} delta="+12%" tone="emerald" />
        <Kpi icon={<Network className="h-5 w-5" />} label="Partnerships" value={stats.partners} delta="+2" tone="fuchsia" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Attendance Trend</h3>
              <p className="text-xs text-slate-500">Last 14 days</p>
            </div>
            <Badge tone="indigo">{stats.rate}% avg</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={attendanceTrend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "none", borderRadius: 12, color: "#fff" }} />
                <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={3} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Task Breakdown</h3>
            <Badge tone="violet">{tasks.length} total</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={taskBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={4}>
                  {taskBreakdown.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "none", borderRadius: 12, color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Finance Summary</h3>
              <p className="text-xs text-slate-500">Income vs Expense</p>
            </div>
            <div className="flex gap-2">
              <Badge tone="emerald">{fmtPKR(stats.income)} in</Badge>
              <Badge tone="rose">{fmtPKR(stats.expense)} out</Badge>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={financeMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "none", borderRadius: 12, color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" radius={[8, 8, 0, 0]} fill="#10b981" />
                <Bar dataKey="expense" radius={[8, 8, 0, 0]} fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Outreach Pipeline</h3>
            <Badge tone="fuchsia">{outreach.length} contacts</Badge>
          </div>
          <div className="space-y-3">
            {["Lead", "Contacted", "Meeting Scheduled", "Proposal Sent", "Partnership"].map((stage) => {
              const count = outreach.filter((o) => o.stage === stage).length;
              const pct = outreach.length ? (count / outreach.length) * 100 : 0;
              return (
                <div key={stage}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{stage}</span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full soc-bg-teal"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent activity + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Activity</h3>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/5">
                <Avatar name={a.user.name} gradient={a.user.avatar} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate"><span className="font-semibold">{a.user.name.split("(")[0]}</span> {a.action}</p>
                  <p className="text-xs text-slate-500">{new Date(a.date).toLocaleString()}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Upcoming Events</h3>
            <Badge tone="indigo">{stats.upcoming}</Badge>
          </div>
          <div className="space-y-3">
            {events.filter((e) => e.status === "Upcoming").map((e) => (
              <div key={e.id} className="p-4 rounded-xl soc-bg-soft border border-indigo-500/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{e.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(e.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {e.location}
                    </p>
                  </div>
                  <Badge tone="emerald">{e.registered}/{e.capacity}</Badge>
                </div>
                <div className="mt-3 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full soc-bg-teal" style={{ width: `${(e.registered / e.capacity) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Logged In Users</h3>
          <Badge tone="indigo">{loggedInUsers.length}</Badge>
        </div>
        {loggedInUsers.length === 0 ? (
          <p className="text-sm text-slate-500">No member has logged in yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200/60 dark:border-white/10">
                  <th className="py-3 px-3">Member</th>
                  <th className="py-3 px-3">Username</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Last Login</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loggedInUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-200/60 dark:border-white/5">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={u.name} gradient={u.avatar} size={32} />
                        <span className="font-semibold">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono">{u.username}</td>
                    <td className="py-3 px-3"><Badge tone={u.role === "Super Admin" ? "fuchsia" : "indigo"}>{u.role}</Badge></td>
                    <td className="py-3 px-3 text-slate-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}</td>
                    <td className="py-3 px-3"><Badge tone={u.status === "Active" ? "emerald" : u.status === "Suspended" ? "rose" : "slate"}>{u.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  delta,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delta?: string;
  tone: "indigo" | "emerald" | "sky" | "amber" | "violet" | "fuchsia";
}) {
  const tones: Record<string, string> = {
    indigo: "soc-bg-teal",
    emerald: "soc-bg-teal",
    sky: "bg-cyan-500",
    amber: "soc-bg-amber",
    violet: "soc-bg-main",
    fuchsia: "soc-bg-main",
  };
  return (
    <Card className="p-4 hover:scale-[1.01] transition-transform">
      <div className="flex items-start justify-between">
        <div className={`h-10 w-10 rounded-xl ${tones[tone]} text-white flex items-center justify-center shadow-md`}>
          {icon}
        </div>
        {delta && <Badge tone="emerald">{delta}</Badge>}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </Card>
  );
}
