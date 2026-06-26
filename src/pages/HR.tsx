import { useState } from "react";
import { Avatar, Badge, Button, Card, Input, Label, Modal, Select, Textarea } from "../components/ui";
import { useApp } from "../context/AppContext";
import type { Application } from "../types";
import { CheckCircle2, FileText, Plus, UserPlus2, Users, Activity, ClipboardCheck, Building2 } from "lucide-react";

const stages: Application["stage"][] = ["Applied", "Screening", "Interview", "Evaluation", "Onboarding", "Hired", "Rejected"];
const stageTone: Record<Application["stage"], any> = {
  Applied: "slate",
  Screening: "sky",
  Interview: "indigo",
  Evaluation: "violet",
  Onboarding: "amber",
  Hired: "emerald",
  Rejected: "rose",
};

export default function HR() {
  const { applications, addApplication, updateApplication, hasPermission, users, tasks, attendance, departments } = useApp();
  const canManage = hasPermission("manage_hr");
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<Application | null>(null);
  const [form, setForm] = useState<Partial<Application>>({
    name: "", email: "", phone: "", position: "", stage: "Applied", appliedAt: new Date().toISOString(), notes: "",
  });

  const stats = stages.reduce<Record<string, number>>((acc, s) => {
    acc[s] = applications.filter((a) => a.stage === s).length;
    return acc;
  }, {});
  const activeMembers = users.filter((u) => u.status === "Active").length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const avgAttendance = users.length ? Math.round(users.reduce((sum, u) => sum + u.attendance, 0) / users.length) : 0;

  const create = () => {
    if (!form.name || !form.position) return;
    addApplication({
      name: form.name!, email: form.email!, phone: form.phone!, position: form.position!,
      stage: form.stage as Application["stage"], appliedAt: new Date().toISOString(), notes: form.notes || "",
    });
    setOpen(false);
    setForm({ name: "", email: "", phone: "", position: "", stage: "Applied", appliedAt: new Date().toISOString(), notes: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HR Module</h1>
          <p className="text-sm text-slate-500">Recruitment · Interviews · Evaluation · Onboarding</p>
        </div>
        {canManage && <Button icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>New Application</Button>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {stages.map((s) => (
          <Card key={s} className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{s}</p>
            <p className="text-2xl font-bold mt-1">{stats[s] || 0}</p>
            <Badge tone={stageTone[s]} className="mt-2">Pipeline</Badge>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4"><Users className="h-5 w-5 text-teal-600 mb-2" /><p className="text-xs text-slate-500 uppercase tracking-wider">Active Members</p><p className="text-2xl font-bold mt-1">{activeMembers}</p></Card>
        <Card className="p-4"><Activity className="h-5 w-5 text-teal-600 mb-2" /><p className="text-xs text-slate-500 uppercase tracking-wider">Avg Attendance</p><p className="text-2xl font-bold mt-1">{avgAttendance}%</p></Card>
        <Card className="p-4"><ClipboardCheck className="h-5 w-5 text-teal-600 mb-2" /><p className="text-xs text-slate-500 uppercase tracking-wider">Completed Tasks</p><p className="text-2xl font-bold mt-1">{completedTasks}</p></Card>
        <Card className="p-4"><Building2 className="h-5 w-5 text-teal-600 mb-2" /><p className="text-xs text-slate-500 uppercase tracking-wider">Departments</p><p className="text-2xl font-bold mt-1">{departments.length}</p></Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">All Member Details</h3>
          <Badge tone="indigo">HR View</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200/60 dark:border-white/10">
              <tr>
                <th className="text-left py-3 px-3">Member</th>
                <th className="text-left py-3 px-3">Username</th>
                <th className="text-left py-3 px-3">Department</th>
                <th className="text-left py-3 px-3">Role</th>
                <th className="text-left py-3 px-3">Attendance</th>
                <th className="text-left py-3 px-3">Points</th>
                <th className="text-left py-3 px-3">Performance</th>
                <th className="text-left py-3 px-3">Tasks</th>
                <th className="text-left py-3 px-3">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {users.map((u) => {
                const mine = tasks.filter((t) => t.assignees.includes(u.id));
                const done = mine.filter((t) => t.status === "Completed").length;
                const attCount = attendance.filter((a) => a.userId === u.id).length;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="py-3 px-3 min-w-56"><div className="flex items-center gap-2"><Avatar name={u.name} gradient={u.avatar} size={32} /><div><p className="font-semibold">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div></div></td>
                    <td className="py-3 px-3 font-mono">{u.username}</td>
                    <td className="py-3 px-3">{u.department}</td>
                    <td className="py-3 px-3"><Badge tone={u.role === "Super Admin" ? "fuchsia" : "slate"}>{u.role}</Badge></td>
                    <td className="py-3 px-3">{u.attendance}% <span className="text-xs text-slate-500">({attCount} rec)</span></td>
                    <td className="py-3 px-3">{u.points}</td>
                    <td className="py-3 px-3">{u.performanceScore}</td>
                    <td className="py-3 px-3">{done}/{mine.length}</td>
                    <td className="py-3 px-3 text-slate-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {applications.map((a) => (
          <Card key={a.id} className="p-5">
            <div className="flex items-start gap-3">
              <Avatar name={a.name} size={48} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{a.name}</p>
                <p className="text-xs text-slate-500">{a.position}</p>
                <Badge tone={stageTone[a.stage]} className="mt-2">{a.stage}</Badge>
              </div>
              {a.score && <Badge tone="emerald">{a.score}/100</Badge>}
            </div>
            <p className="mt-3 text-xs text-slate-500">Applied {new Date(a.appliedAt).toLocaleDateString()}</p>
            {a.notes && <p className="mt-2 text-sm line-clamp-2">{a.notes}</p>}
            <div className="mt-4 flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" icon={<FileText className="h-3 w-3" />} onClick={() => setViewing(a)}>View</Button>
              {canManage && a.stage !== "Hired" && a.stage !== "Rejected" && (
                <Select
                  value={a.stage}
                  onChange={(e) => updateApplication(a.id, { stage: e.target.value as Application["stage"] })}
                  className="h-8 text-xs flex-1"
                >
                  {stages.map((s) => <option key={s}>{s}</option>)}
                </Select>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Application">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Full Name</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Position</Label><Input value={form.position || ""} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-6"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button icon={<UserPlus2 className="h-4 w-4" />} onClick={create}>Create</Button></div>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Candidate Evaluation" size="lg">
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={viewing.name} size={56} />
              <div>
                <p className="font-bold text-lg">{viewing.name}</p>
                <p className="text-sm text-slate-500">{viewing.position}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Card className="p-3"><p className="text-xs uppercase text-slate-500">Email</p><p>{viewing.email}</p></Card>
              <Card className="p-3"><p className="text-xs uppercase text-slate-500">Phone</p><p>{viewing.phone}</p></Card>
              <Card className="p-3"><p className="text-xs uppercase text-slate-500">Stage</p><Badge tone={stageTone[viewing.stage]}>{viewing.stage}</Badge></Card>
              <Card className="p-3"><p className="text-xs uppercase text-slate-500">Score</p><p>{viewing.score || "Not evaluated"}</p></Card>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea defaultValue={viewing.notes} onBlur={(e) => updateApplication(viewing.id, { notes: e.target.value })} />
            </div>
            {canManage && (
              <div className="flex gap-2">
                <Button icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => { updateApplication(viewing.id, { stage: "Hired" }); setViewing(null); }}>Mark Hired</Button>
                <Button variant="outline" onClick={() => { updateApplication(viewing.id, { stage: "Onboarding" }); setViewing(null); }}>Start Onboarding</Button>
                <Button variant="ghost" onClick={() => { updateApplication(viewing.id, { stage: "Rejected" }); setViewing(null); }}>Reject</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
