import { useState } from "react";
import { Avatar, Badge, Button, Card, Input, Label, Modal, Select, Textarea } from "../components/ui";
import { useApp } from "../context/AppContext";
import { Building2, Plus, Trash2 } from "lucide-react";

export default function Departments() {
  const { departments, users, addDepartment, updateDepartment, deleteDepartment, updateUser, hasPermission } = useApp();
  const canManage = hasPermission("manage_settings") || hasPermission("manage_members");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", leadId: "", coLeadId: "", memberIds: [] as string[] });

  const openNew = () => { setEditing(null); setForm({ name: "", description: "", leadId: "", coLeadId: "", memberIds: [] }); setOpen(true); };
  const openEdit = (d: any) => { 
    const deptMembers = users.filter((u) => u.department === d.name).map((u) => u.id);
    setEditing(d); 
    setForm({ name: d.name, description: d.description, leadId: d.leadId || "", coLeadId: d.coLeadId || "", memberIds: deptMembers }); 
    setOpen(true); 
  };
  const save = () => {
    if (!form.name) return;
    if (editing) {
      updateDepartment(editing.id, form);
      // Update user departments
      form.memberIds.forEach((userId) => {
        const user = users.find((u) => u.id === userId);
        if (user && user.department !== form.name) {
          updateUser(userId, { ...user, department: form.name });
        }
      });
    } else {
      addDepartment(form.name, form.description, form.leadId || undefined, form.coLeadId || undefined);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
          <p className="text-sm text-slate-500">Teams, roles, and member distribution.</p>
        </div>
        {canManage && <Button icon={<Plus className="h-4 w-4" />} onClick={openNew}>Create Department</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {departments.map((d) => {
          const deptMembers = users.filter((u) => u.department === d.name);
          
          // Group by role: Lead, Co-Lead, Regular Members
          const lead = deptMembers.find((u) => u.id === d.leadId);
          const coLead = deptMembers.find((u) => u.id === d.coLeadId);
          const coLeads = deptMembers.filter((u) => u.role.includes("Co-") && u.id !== d.leadId && u.id !== d.coLeadId);
          const regularMembers = deptMembers.filter((u) => !u.role.includes("Lead") && !u.role.includes("Co-") && u.id !== d.leadId && u.id !== d.coLeadId);
          
          const avgAttendance = deptMembers.length ? Math.round(deptMembers.reduce((s, u) => s + u.attendance, 0) / deptMembers.length) : 0;
          const avgScore = deptMembers.length ? Math.round(deptMembers.reduce((s, u) => s + u.performanceScore, 0) / deptMembers.length) : 0;
          
          return (
            <Card key={d.id} className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-teal-600" />
                    <h3 className="font-bold text-lg">{d.name}</h3>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{d.description}</p>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(d)}>Edit</Button>
                    <Button size="sm" variant="ghost" icon={<Trash2 className="h-3 w-3" />} onClick={() => deleteDepartment(d.id)}>Del</Button>
                  </div>
                )}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Members" value={deptMembers.length} />
                <Stat label="Attend" value={`${avgAttendance}%`} />
                <Stat label="Score" value={avgScore} />
              </div>

              {/* Department Lead */}
              {lead && (
                <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">🏆 Department Lead</p>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-teal-500/10 ring-1 ring-teal-500/20">
                    <Avatar name={lead.name} gradient={lead.avatar} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{lead.name}</p>
                      <p className="text-xs text-slate-500 truncate">{lead.position}</p>
                    </div>
                    <Badge tone="emerald">{lead.points} pts</Badge>
                  </div>
                </div>
              )}

              {/* Co-Lead */}
              {coLead && (
                <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">⭐ Co-Lead</p>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-500/10 ring-1 ring-violet-500/20">
                    <Avatar name={coLead.name} gradient={coLead.avatar} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{coLead.name}</p>
                      <p className="text-xs text-slate-500 truncate">{coLead.position}</p>
                    </div>
                    <Badge tone="violet">{coLead.points} pts</Badge>
                  </div>
                </div>
              )}

              {/* Other Co-Leads */}
              {coLeads.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">👥 Co-Leads ({coLeads.length})</p>
                  <div className="space-y-1">
                    {coLeads.map((u) => (
                      <div key={u.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100/40 dark:hover:bg-white/5">
                        <Avatar name={u.name} gradient={u.avatar} size={28} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{u.name}</p>
                        </div>
                        <Badge tone="violet" className="text-[10px]">{u.points}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Members */}
              {regularMembers.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">👤 Members ({regularMembers.length})</p>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {regularMembers.map((u) => (
                      <div key={u.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100/40 dark:hover:bg-white/5 text-xs">
                        <Avatar name={u.name} gradient={u.avatar} size={24} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{u.name}</p>
                        </div>
                        <span className="text-slate-400 text-[10px]">{u.attendance}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {deptMembers.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm border-t border-slate-200 dark:border-white/10 pt-4">
                  No members yet
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
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </Select>
          </div>
          <div>
            <Label>Co-Lead</Label>
            <Select value={form.coLeadId} onChange={(e) => setForm({ ...form, coLeadId: e.target.value })}>
              <option value="">No co-lead assigned</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </Select>
          </div>
          <div>
            <Label>Department Members</Label>
            <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/5 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={form.memberIds.includes(u.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({ ...form, memberIds: [...form.memberIds, u.id] });
                      } else {
                        setForm({ ...form, memberIds: form.memberIds.filter((id) => id !== u.id) });
                      }
                    }}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.role}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">{form.memberIds.length} selected</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></div>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg bg-slate-100/60 dark:bg-white/5 p-2"><p className="text-sm font-bold">{value}</p><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p></div>;
}