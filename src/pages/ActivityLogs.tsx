import { useMemo, useState } from "react";
import { Avatar, Badge, Card, Input, Select } from "../components/ui";
import { useApp } from "../context/AppContext";
import type { ActivityLog } from "../types";
import { Activity as ActivityIcon, Search, ShieldAlert } from "lucide-react";

const categories: ActivityLog["category"][] = [
  "auth", "members", "tasks", "events", "finance", "outreach", "attendance", "settings", "ai", "comms",
];
const tone: Record<ActivityLog["category"], any> = {
  auth: "indigo", members: "sky", tasks: "violet", events: "fuchsia",
  finance: "emerald", outreach: "amber", attendance: "rose", settings: "slate", ai: "violet", comms: "indigo",
};

export default function ActivityLogs() {
  const { activityLogs, users, isSuperAdmin, hasPermission } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");

  const canView = isSuperAdmin() || hasPermission("view_logs");

  const filtered = useMemo(() => {
    return activityLogs.filter((l) => {
      if (cat !== "All" && l.category !== cat) return false;
      if (q) {
        const s = q.toLowerCase();
        return l.action.toLowerCase().includes(s) || l.actorName.toLowerCase().includes(s);
      }
      return true;
    });
  }, [activityLogs, cat, q]);

  if (!canView) {
    return (
      <Card className="p-10 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-amber-500 mb-3" />
        <p className="font-semibold">Restricted</p>
        <p className="text-sm text-slate-500">Only Super Admin and authorized roles can view activity logs.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ActivityIcon className="h-6 w-6" /> Activity Logs</h1>
        <p className="text-sm text-slate-500">Full audit trail of every action across the organization.</p>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by action or actor…" className="pl-10" />
        </div>
        <Select value={cat} onChange={(e) => setCat(e.target.value)} className="md:w-56">
          <option>All</option>
          {categories.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
        </Select>
      </Card>

      <Card className="p-2">
        <div className="divide-y divide-slate-200/60 dark:divide-white/5">
          {filtered.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No logs match your filter.</p>}
          {filtered.map((l) => {
            const u = users.find((x) => x.id === l.actorId);
            return (
              <div key={l.id} className="flex items-center gap-3 p-3 hover:bg-slate-100/40 dark:hover:bg-white/5 rounded-xl">
                <Avatar name={l.actorName} gradient={u?.avatar} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm"><span className="font-semibold">{l.actorName}</span> <span className="text-slate-600 dark:text-slate-400">{l.action}</span></p>
                  <p className="text-xs text-slate-500">{new Date(l.createdAt).toLocaleString()} · ID: {l.target?.slice(0, 12) || "—"}</p>
                </div>
                <Badge tone={tone[l.category]}>{l.category}</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
