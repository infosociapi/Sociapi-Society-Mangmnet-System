import { useMemo, useState } from "react";
import { Badge, Button, Card, Input, Label, Modal, Select, Textarea } from "../components/ui";
import { useApp } from "../context/AppContext";
import type { OutreachContact } from "../types";
import { Building2, GraduationCap, HandHelping, Handshake, Plus, Trash2, ArrowRight } from "lucide-react";

const stages: OutreachContact["stage"][] = ["Lead", "Contacted", "Meeting Scheduled", "Proposal Sent", "Partnership"];
const stageTone: Record<OutreachContact["stage"], any> = {
  Lead: "slate", Contacted: "sky", "Meeting Scheduled": "indigo", "Proposal Sent": "violet", Partnership: "emerald",
};
const typeIcon: Record<string, React.ReactNode> = {
  Company: <Building2 className="h-4 w-4" />,
  Sponsor: <Handshake className="h-4 w-4" />,
  NGO: <HandHelping className="h-4 w-4" />,
  University: <GraduationCap className="h-4 w-4" />,
};

export default function Outreach() {
  const { outreach, addOutreach, updateOutreach, deleteOutreach, hasPermission } = useApp();
  const canManage = hasPermission("manage_outreach");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [activeTab, setActiveTab] = useState<"All" | OutreachContact["type"]>("All");
  const [form, setForm] = useState<Partial<OutreachContact>>({
    name: "", organization: "", email: "", phone: "", type: "Company", stage: "Lead", notes: "", lastContact: new Date().toISOString(),
  });

  const filtered = activeTab === "All" ? outreach : outreach.filter((o) => o.type === activeTab);
  const stats = useMemo(() => {
    const result: Record<OutreachContact["stage"], number> = {
      "Lead": 0, "Contacted": 0, "Meeting Scheduled": 0, "Proposal Sent": 0, "Partnership": 0
    };
    filtered.forEach((o) => {
      result[o.stage]++;
    });
    return result;
  }, [filtered]);

  const create = () => {
    if (!form.name || !form.organization) return;
    addOutreach({
      name: form.name!,
      organization: form.organization!,
      email: form.email || "",
      phone: form.phone || "",
      type: form.type as OutreachContact["type"],
      stage: form.stage as OutreachContact["stage"],
      notes: form.notes || "",
      lastContact: new Date().toISOString(),
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

      <Card className="p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {["All", "Company", "Sponsor", "NGO", "University"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === t ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300"
              }`}
            >
              {t} ({t === "All" ? outreach.length : outreach.filter((o) => o.type === t).length})
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("kanban")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              view === "kanban" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 dark:bg-white/5"
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              view === "list" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 dark:bg-white/5"
            }`}
          >
            List
          </button>
        </div>
      </Card>

      {view === "kanban" ? (
        <div className="w-full overflow-x-auto">
          <div className="flex gap-4 pb-6" style={{ minWidth: "fit-content", paddingRight: "1.5rem" }}>
            {stages.map((s) => {
              const items = filtered.filter((o) => o.stage === s);
              return (
                <div key={s} className="flex-shrink-0 w-80">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{s}</h3>
                      <Badge tone={stageTone[s]}>{items.length}</Badge>
                    </div>
                  </div>
                  <div className="space-y-3 min-h-[400px] rounded-xl bg-slate-100/40 dark:bg-white/5 p-3">
                    {items.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <p className="text-xs">No contacts</p>
                      </div>
                    ) : (
                      items.map((o) => (
                        <Card
                          key={o.id}
                          className="p-3 cursor-move hover:shadow-md transition-shadow bg-white dark:bg-slate-900"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-slate-400">{typeIcon[o.type]}</span>
                                <p className="font-semibold text-sm truncate">{o.organization}</p>
                              </div>
                              <p className="text-xs text-slate-500 truncate">{o.name}</p>
                            </div>
                          </div>
                          {o.email && <p className="text-xs text-slate-500 truncate">✉ {o.email}</p>}
                          {o.phone && <p className="text-xs text-slate-500 truncate">📞 {o.phone}</p>}
                          {o.notes && <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">"{o.notes}"</p>}
                          <div className="mt-3 flex gap-1 flex-wrap">
                            {s !== "Partnership" && (
                              <Select
                                className="text-xs h-7 flex-1"
                                value={o.stage}
                                onChange={(e) => updateOutreach(o.id, { stage: e.target.value as OutreachContact["stage"] })}
                              >
                                {stages.map((st) => <option key={st} value={st}>{st}</option>)}
                              </Select>
                            )}
                            {canManage && (
                              <button
                                onClick={() => deleteOutreach(o.id)}
                                className="h-7 px-2 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 flex items-center justify-center text-xs"
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-100 dark:bg-white/5">
              <tr className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="text-left p-3">Organization</th>
                <th className="text-left p-3">Contact</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Phone</th>
                <th className="text-left p-3">Stage</th>
                <th className="text-left p-3">Notes</th>
                {canManage && <th className="text-right p-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="text-center py-8 text-slate-500">
                    No outreach contacts
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="p-3 font-semibold">{o.organization}</td>
                    <td className="p-3 text-sm">{o.name}</td>
                    <td className="p-3">
                      <Badge tone="slate" className="gap-1">
                        {typeIcon[o.type]}
                        {o.type}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-slate-500">{o.email || "—"}</td>
                    <td className="p-3 text-sm text-slate-500">{o.phone || "—"}</td>
                    <td className="p-3">
                      <Badge tone={stageTone[o.stage]}>{o.stage}</Badge>
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">{o.notes}</td>
                    {canManage && (
                      <td className="p-3 text-right">
                        <button
                          onClick={() => deleteOutreach(o.id)}
                          className="text-xs text-rose-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stages.map((s) => (
          <Card key={s} className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{s}</p>
            <p className="text-2xl font-bold mt-2">{stats[s]}</p>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Contact" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Contact Name</Label>
              <Input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Organization</Label>
              <Input
                value={form.organization || ""}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
                placeholder="Company Name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+923xx-xxxxxxx"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type as string} onChange={(e) => setForm({ ...form, type: e.target.value as OutreachContact["type"] })}>
                <option value="Company">Company</option>
                <option value="Sponsor">Sponsor</option>
                <option value="NGO">NGO</option>
                <option value="University">University</option>
              </Select>
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={form.stage as string} onChange={(e) => setForm({ ...form, stage: e.target.value as OutreachContact["stage"] })}>
                {stages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes / Details</Label>
            <Textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Partnership opportunities, meeting notes, etc..."
              rows={4}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={create} icon={<Plus className="h-4 w-4" />}>
            Add Contact
          </Button>
        </div>
      </Modal>
    </div>
  );
}