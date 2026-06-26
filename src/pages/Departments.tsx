import { useState } from "react";
import { Avatar, Button, Card, Input, Label, Modal, Select, Textarea } from "../components/ui";
import { useApp } from "../context/AppContext";
import { Building2, Plus, Trash2 } from "lucide-react";

export default function Departments() {
  const { departments, users, addDepartment, updateDepartment, deleteDepartment, hasPermission } = useApp();
  const canManage = hasPermission("manage_settings") || hasPermission("manage_members");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", leadId: "" });

  const openNew = () => { setEditing(null); setForm({ name: "", description: "", leadId: "" }); setOpen(true); };
  const openEdit = (d: any) => { setEditing(d); setForm({ name: d.name, description: d.description, leadId: d.leadId || "" }); setOpen(true); };
  const save = () => {
    if (!form.name) return;
    if (editing) updateDepartment(editing.id, form);
    else addDepartment(form.name, form.description, form.leadId || undefined);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
          <p className="text-sm text-slate-500">Create departments, assign leads and monitor team distribution.</p>
        </div>
        {canManage && <Button icon={<Plus className="h-4 w-4" />} onClick={openNew}>Create Department</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map((d) => {
          const members = users.filter((u) => u.department === d.name);
          const lead = users.find((u) => u.id === d.leadId) || members.find((u) => u.role === "Department Lead");
          const avgAttendance = members.length ? Math.round(members.reduce((s, u) => s + u.attendance, 0) / members.length) : 0;
          const avgScore = members.length ? Math.round(members.reduce((s, u) => s + u.performanceScore, 0) / members.length) : 0;
          return (
            <Card key={d.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="h-11 w-11 rounded-xl soc-bg-teal text-white flex items-center justify-center"><Building2 className="h-5 w-5" /></div>
                {canManage && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(d)}>Edit</Button>
                    <Button size="sm" variant="ghost" icon={<Trash2 className="h-3 w-3" />} onClick={() => deleteDepartment(d.id)}>Delete</Button>
                  </div>
                )}
              </div>
              <h3 className="font-semibold mt-4">{d.name}</h3>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{d.description}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat label="Members" value={members.length} />
                <Stat label="Attend" value={`${avgAttendance}%`} />
                <Stat label="Score" value={avgScore} />
              </div>
              {lead && (
                <div className="mt-4 flex items-center gap-2 p-2 rounded-xl bg-slate-100/60 dark:bg-white/5">
                  <Avatar name={lead.name} gradient={lead.avatar} size={32} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{lead.name}</p>
                    <p className="text-xs text-slate-500">Department Lead</p>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Department" : "Create Department"}>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <Label>Department Lead</Label>
            <Select value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })}>
              <option value="">No lead assigned</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></div>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl bg-slate-100/60 dark:bg-white/5 p-2"><p className="text-sm font-bold">{value}</p><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p></div>;
}