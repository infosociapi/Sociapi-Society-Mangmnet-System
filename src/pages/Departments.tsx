import { useState } from "react";
import { Avatar, Badge, Button, Card, Input, Label, Modal, Select, Textarea } from "../components/ui";
import { useApp } from "../context/AppContext";
import { Building2, Plus, Trash2, Users } from "lucide-react";

export default function Departments() {
  const { departments, users, addDepartment, updateDepartment, deleteDepartment, hasPermission } = useApp();
  const canManage = hasPermission("manage_settings") || hasPermission("manage_members");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", leadId: "", coLeadId: "" });

  const openNew = () => { 
    setEditing(null); 
    setForm({ name: "", description: "", leadId: "", coLeadId: "" }); 
    setOpen(true); 
  };
  
  const openEdit = (d: any) => { 
    setEditing(d); 
    setForm({ 
      name: d.name, 
      description: d.description, 
      leadId: d.leadId || "", 
      coLeadId: d.coLeadId || "" 
    }); 
    setOpen(true); 
  };
  
  const save = () => {
    if (!form.name) return;
    if (editing) updateDepartment(editing.id, form);
    else addDepartment(form.name, form.description, form.leadId || undefined, form.coLeadId || undefined);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
          <p className="text-sm text-slate-500">Manage Lead, Co-Lead اور team members ہر ڈیپارٹمنٹ میں۔</p>
        </div>
        {canManage && <Button icon={<Plus className="h-4 w-4" />} onClick={openNew}>نیا ڈیپارٹمنٹ</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map((d) => {
          // تمام ممبرز اس ڈیپارٹمنٹ کے
          const members = users.filter((u) => u.department === d.name);
          
          // Lead، Co-Lead، اور دوسرے ممبرز الگ الگ کریں
          const lead = users.find((u) => u.id === d.leadId);
          const coLead = users.find((u) => u.id === d.coLeadId);
          const otherMembers = members.filter((u) => u.id !== d.leadId && u.id !== d.coLeadId);
          
          const avgAttendance = members.length ? Math.round(members.reduce((s, u) => s + u.attendance, 0) / members.length) : 0;
          const avgScore = members.length ? Math.round(members.reduce((s, u) => s + u.performanceScore, 0) / members.length) : 0;
          
          return (
            <Card key={d.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="h-11 w-11 rounded-xl soc-bg-teal text-white flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(d)}>ترمیم</Button>
                    <Button size="sm" variant="ghost" icon={<Trash2 className="h-3 w-3" />} onClick={() => deleteDepartment(d.id)}>حذف</Button>
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold mt-4">{d.name}</h3>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{d.description}</p>
              
              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat label="ممبرز" value={members.length} />
                <Stat label="حاضری" value={`${avgAttendance}%`} />
                <Stat label="سکور" value={avgScore} />
              </div>

              {/* Lead */}
              {lead && (
                <div className="mt-3 flex items-center gap-2 p-2 rounded-xl bg-amber-500/15 ring-1 ring-amber-500/20">
                  <Avatar name={lead.name} gradient={lead.avatar} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{lead.name}</p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-300">👑 Lead</p>
                  </div>
                </div>
              )}

              {/* Co-Lead */}
              {coLead && (
                <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-violet-500/15 ring-1 ring-violet-500/20">
                  <Avatar name={coLead.name} gradient={coLead.avatar} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{coLead.name}</p>
                    <p className="text-[10px] text-violet-700 dark:text-violet-300">⭐ Co-Lead</p>
                  </div>
                </div>
              )}

              {/* دوسرے ممبرز */}
              {otherMembers.length > 0 && (
                <div className="mt-2 px-2 py-1.5 rounded-lg bg-slate-100/60 dark:bg-white/5">
                  <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    <Users className="h-3 w-3 inline mr-1" /> {otherMembers.length} ممبرز
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {otherMembers.slice(0, 3).map((m) => (
                      <Avatar key={m.id} name={m.name} gradient={m.avatar} size={24} title={m.name} />
                    ))}
                    {otherMembers.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-slate-300 dark:bg-white/10 flex items-center justify-center text-[10px] font-semibold">
                        +{otherMembers.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {otherMembers.length === 0 && !lead && !coLead && (
                <div className="mt-2 px-2 py-1.5 rounded-lg bg-slate-100/60 dark:bg-white/5 text-center">
                  <p className="text-[10px] text-slate-500">کوئی ممبر نہیں</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "ڈیپارٹمنٹ میں ترمیم" : "نیا ڈیپارٹمنٹ"}>
        <div className="space-y-4">
          <div>
            <Label>ڈیپارٹمنٹ کا نام</Label>
            <Input 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              placeholder="مثال: Media, Events, Technical"
            />
          </div>

          <div>
            <Label>تفصیل</Label>
            <Textarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              placeholder="اس ڈیپارٹمنٹ کی تفصیل"
            />
          </div>
          
          <div>
            <Label>👑 Lead</Label>
            <Select 
              value={form.leadId} 
              onChange={(e) => setForm({ ...form, leadId: e.target.value })}
            >
              <option value="">کوئی نہیں</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.position})</option>)}
            </Select>
          </div>

          <div>
            <Label>⭐ Co-Lead</Label>
            <Select 
              value={form.coLeadId} 
              onChange={(e) => setForm({ ...form, coLeadId: e.target.value })}
            >
              <option value="">کوئی نہیں</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.position})</option>)}
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setOpen(false)}>منسوخ</Button>
          <Button onClick={save}>محفوظ کریں</Button>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-100/60 dark:bg-white/5 p-2">
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}