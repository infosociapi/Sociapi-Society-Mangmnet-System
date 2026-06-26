import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Avatar, Badge, Button, Card } from "../components/ui";
import { useApp } from "../context/AppContext";
import { Award, BadgeCheck, Bell, Calendar, CheckCircle2, ClipboardList, Hash, IdCard, ListChecks, Sparkles, TrendingUp, Upload } from "lucide-react";

export default function MyDashboard() {
  const { currentUser, tasks, attendance, notifications, events, users } = useApp();
  if (!currentUser) return null;

  const myTasks = tasks.filter((t) => t.assignees.includes(currentUser.id));
  const myAtt = attendance.filter((a) => a.userId === currentUser.id);
  const myNotifs = notifications.filter((n) => !n.userId || n.userId === currentUser.id).slice(0, 5);
  const myRank = useMemo(() => {
    const sorted = [...users].sort((a, b) => b.points - a.points);
    return sorted.findIndex((u) => u.id === currentUser.id) + 1;
  }, [users, currentUser]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-80 h-80 rounded-full soc-bg-soft blur-3xl" />
        <div className="relative p-6 lg:p-8 flex flex-wrap items-center gap-6 justify-between">
          <div className="flex items-center gap-5">
            <Avatar name={currentUser.name} gradient={currentUser.avatar} size={88} />
            <div>
              <Badge tone={currentUser.role === "Super Admin" ? "fuchsia" : "indigo"} className="mb-2">
                {currentUser.role === "Super Admin" && <Sparkles className="h-3 w-3" />} {currentUser.role}
              </Badge>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Hi, {currentUser.name.split(" ")[0]} 👋</h1>
              <p className="text-sm text-slate-500 mt-1">{currentUser.position} · {currentUser.department}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge tone="indigo"><Hash className="h-3 w-3" />{currentUser.memberId}</Badge>
                <Badge tone="violet"><BadgeCheck className="h-3 w-3" />{currentUser.specialNumber}</Badge>
              </div>
            </div>
          </div>
          <Link to="/app/id-card">
            <Button icon={<IdCard className="h-4 w-4" />}>View My ID Card</Button>
          </Link>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="h-10 w-10 rounded-xl soc-bg-teal text-white flex items-center justify-center"><TrendingUp className="h-5 w-5" /></div>
          <p className="mt-3 text-2xl font-bold">{currentUser.points}</p>
          <p className="text-xs text-slate-500">Total Points</p>
        </Card>
        <Card className="p-4">
          <div className="h-10 w-10 rounded-xl soc-bg-teal text-white flex items-center justify-center"><CheckCircle2 className="h-5 w-5" /></div>
          <p className="mt-3 text-2xl font-bold">{currentUser.attendance}%</p>
          <p className="text-xs text-slate-500">Attendance Rate</p>
        </Card>
        <Card className="p-4">
          <div className="h-10 w-10 rounded-xl soc-bg-amber text-white flex items-center justify-center"><ClipboardList className="h-5 w-5" /></div>
          <p className="mt-3 text-2xl font-bold">{myTasks.filter((t) => t.status !== "Completed").length}</p>
          <p className="text-xs text-slate-500">Open Tasks</p>
        </Card>
        <Card className="p-4">
          <div className="h-10 w-10 rounded-xl soc-bg-main text-white flex items-center justify-center"><Award className="h-5 w-5" /></div>
          <p className="mt-3 text-2xl font-bold">#{myRank}</p>
          <p className="text-xs text-slate-500">Leaderboard Rank</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><ListChecks className="h-4 w-4" /> My Task List</h3>
            <Link to="/app/tasks"><Button size="sm" variant="ghost">View all</Button></Link>
          </div>
          <div className="space-y-3">
            {myTasks.length === 0 && <p className="text-sm text-slate-500">No tasks assigned yet.</p>}
            {myTasks.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100/40 dark:hover:bg-white/5">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                  t.status === "Completed" ? "bg-emerald-500/15 text-emerald-600" :
                  t.status === "Overdue" ? "bg-rose-500/15 text-rose-600" :
                  t.status === "Under Review" || t.status === "Submitted" ? "bg-violet-500/15 text-violet-600" :
                  "bg-indigo-500/15 text-indigo-600"
                }`}>
                  {t.status === "Completed" ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{t.title}</p>
                  <p className="text-xs text-slate-500">Due {new Date(t.deadline).toLocaleDateString()}</p>
                </div>
                <Badge tone={t.status === "Overdue" ? "rose" : t.status === "Completed" || t.status === "Approved" ? "emerald" : t.status === "Under Review" || t.status === "Submitted" ? "violet" : "amber"}>{t.status}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Link to="/app/tasks"><Button size="sm" icon={<Upload className="h-3 w-3" />}>Submit Task</Button></Link>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</h3>
          <div className="space-y-3">
            {myNotifs.length === 0 && <p className="text-sm text-slate-500">No notifications.</p>}
            {myNotifs.map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-slate-100/40 dark:bg-white/5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <Badge tone={n.type === "warning" ? "amber" : n.type === "success" ? "emerald" : n.type === "alert" ? "rose" : "indigo"}>{n.channel}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">{n.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance History */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar className="h-4 w-4" /> Attendance History</h3>
          {myAtt.length === 0 && <p className="text-sm text-slate-500">No attendance recorded yet. Scan your QR at the next event.</p>}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {myAtt.slice(0, 30).map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100/40 dark:hover:bg-white/5 text-sm">
                <span>{new Date(a.date).toLocaleString()}</span>
                <div className="flex items-center gap-2">
                  <Badge tone="slate">{a.method}</Badge>
                  <Badge tone={a.status === "Present" ? "emerald" : a.status === "Late" ? "amber" : "rose"}>{a.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Certificates */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Award className="h-4 w-4" /> Certificates</h3>
          {currentUser.certificates.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No certificates yet.</p>
              <p className="text-xs text-slate-400 mt-1">Earn certificates by attending events.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentUser.certificates.map((c) => (
                <span key={c} className="px-3 py-2 rounded-xl soc-bg-soft ring-1 ring-amber-500/20 text-xs font-medium flex items-center gap-2">
                  <Award className="h-3 w-3 text-amber-500" /> {c}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Upcoming Events</h4>
            <div className="space-y-2">
              {events.filter((e) => e.status === "Upcoming").slice(0, 3).map((e) => (
                <div key={e.id} className="text-sm flex justify-between">
                  <span>{e.title}</span>
                  <span className="text-xs text-slate-500">{new Date(e.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
