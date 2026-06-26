import { useState } from "react";
import { Badge, Button, Card, Input, Label, Modal, Select, Textarea } from "../components/ui";
import { useApp } from "../context/AppContext";
import type { OutreachContact } from "../types";
import { Building2, GraduationCap, HandHelping, Handshake, Plus } from "lucide-react";

const stages: OutreachContact["stage"][] = ["Lead", "Contacted", "Meeting Scheduled", "Proposal Sent", "Partnership"];
const stageTone: Record<OutreachContact["stage"], any> = {
  Lead: "slate", Contacted: "sky", "Meeting Scheduled": "indigo", "Proposal Sent": "violet", Partnership: "emerald",
};
const typeIcon = {
  Company: <Building2 className="h-4 w-4" />,
  Sponsor: <Handshake className="h-4 w-4" />,
  NGO: <HandHelping className="h-4 w-4" />,
  University: <GraduationCap className="h-4 w-4" />,
};

export default function Outreach() {
  const { outreach, addOutreach, updateOutreach, deleteOutreach, hasPermission } = useApp();
  const canManage = hasPermission("manage_outreach");
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"All" | OutreachContact["type"]>("All");
  const [form, setForm] = useState<Partial<OutreachContact>>({
    name: "", organization: "", email: "", phone: "", type: "Company", stage: "Lead", notes: "", lastContact: new Date().toISOString(),
  });

  const filtered = activeTab === "All" ? outreach : outreach.filter((o) => o.type === activeTab);

  const create = () => {
    if (!form.name || !form.organization) return;
    addOutreach({
      name: form.name!, organization: form.organization!, email: form.email || "", phone: form.phone || "",
      type: form.type as OutreachContact["type"], stage: form.stage as OutreachContact["stage"],
      notes: form.notes || "", lastContact: new Date().toISOString(),
    });
    setOpen(false);
    setForm({ ...form, name: "", organization: "", email: "", phone: "", notes: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outreach CRM</h1>
          <p className="text-sm text-slate-500">Company · Sponsor · NGO · University databases + pipeline</p>
        </div>
        {canManage && <Button icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Add Contact</Button>}
      </div>

      <div className="flex flex-wrap gap-2">
        {["All", "Company", "Sponsor", "NGO", "University"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${activeTab === t ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300"}`}
          >
            {t} ({t === "All" ? outreach.length : outreach.filter((o) => o.type === t).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
        {stages.map((s) => {
          const items = filtered.filter((o) => o.stage === s);
          return (
            <div key={s} className="min-w-[250px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-sm font-semibold">{s}</p>
                <Badge tone={stageTone[s]}>{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((o) => (
                  <Card key={o.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{o.organization}</p>
                        <p className="text-xs text-slate-500 truncate">{o.name}</p>
                      </div>
                      <span className="text-slate-400">{typeIcon[o.type]}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{o.notes}</p>
                    {canManage && (
                      <div className="mt-3 flex gap-1">
                        <Select className="h-7 text-xs" value={o.stage} onChange={(e) => updateOutreach(o.id, { stage: e.target.value as OutreachContact["stage"] })}>
                          {stages.map((st) => <option key={st}>{st}</option>)}
                        </Select>
                        <button onClick={() => deleteOutreach(o.id)} className="text-xs text-rose-500 hover:underline px-1">×</button>
                      </div>
                    )}
                  </Card>
                ))}
                {items.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No contacts</p>}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Contact">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Contact Name</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Organization</Label><Input value={form.organization || ""} onChange={(e) => setForm({ ...form, organization: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.type as string} onChange={(e) => setForm({ ...form, type: e.target.value as OutreachContact["type"] })}>
                <option>Company</option><option>Sponsor</option><option>NGO</option><option>University</option>
              </Select>
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={form.stage as string} onChange={(e) => setForm({ ...form, stage: e.target.value as OutreachContact["stage"] })}>
                {stages.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </div>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-6"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Add</Button></div>
      </Modal>
    </div>
  );
}
