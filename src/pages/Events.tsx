import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, Input, Label, Modal, Select, Textarea } from "../components/ui";
import { useApp } from "../context/AppContext";
import type { Event } from "../types";
import { Archive, CalendarDays, Copy, MapPin, Pencil, Plus, Trash2, Users2 } from "lucide-react";

const empty = (): Partial<Event> => ({
  title: "",
  description: "",
  type: "event",
  date: new Date().toISOString().slice(0, 16),
  location: "",
  capacity: 100,
  registered: 0,
  attended: 0,
  status: "Upcoming",
  feedback: [],
  budget: 0,
  expense: 0,
  income: 0,
});

export default function Events() {
  const { events, addEvent, updateEvent, deleteEvent, duplicateEvent, archiveEvent, hasPermission } = useApp();
  const navigate = useNavigate();
  const canManage = hasPermission("manage_events");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState<Partial<Event>>(empty());

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const isPastDate = (e: Event) => new Date(e.date) < startOfToday;
  const upcomingEvents = events.filter((e) => (e.type || "event") === "event" && e.status !== "Archived" && !isPastDate(e) && e.status !== "Completed");
  const upcomingMeetings = events.filter((e) => (e.type || "event") === "meeting" && e.status !== "Archived" && !isPastDate(e) && e.status !== "Completed");
  const pastItems = events.filter((e) => e.status !== "Archived" && (e.status === "Completed" || isPastDate(e)));
  const archived = events.filter((e) => e.status === "Archived");

  const totals = useMemo(() => ({
    budget: events.reduce((s, e) => s + (e.budget || 0), 0),
    expense: events.reduce((s, e) => s + (e.expense || 0), 0),
    income: events.reduce((s, e) => s + (e.income || 0), 0),
  }), [events]);

  const openCreate = () => { setEditing(null); setForm(empty()); setOpen(true); };
  const openEdit = (e: Event) => { setEditing(e); setForm({ ...e, date: new Date(e.date).toISOString().slice(0, 16) }); setOpen(true); };

  const save = () => {
    if (!form.title || !form.date) return;
    const dt = new Date(form.date as string);
    const nowDay = new Date();
    nowDay.setHours(0, 0, 0, 0);
    const eventDay = new Date(dt);
    eventDay.setHours(0, 0, 0, 0);
    const status: Event["status"] = (form.status as Event["status"]) || (eventDay < nowDay ? "Completed" : "Upcoming");
    const payload: Omit<Event, "id"> = {
      title: form.title,
      description: form.description || "",
      type: (form.type as Event["type"]) || "event",
      date: dt.toISOString(),
      location: form.location || "TBA",
      capacity: Number(form.capacity || 0),
      registered: Number(form.registered || 0),
      attended: Number(form.attended || 0),
      status,
      feedback: form.feedback || [],
      budget: Number(form.budget || 0),
      expense: Number(form.expense || 0),
      income: Number(form.income || 0),
      photos: form.photos || [],
      documents: form.documents || [],
    };
    if (editing) updateEvent(editing.id, payload);
    else addEvent(payload);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events & Meetings</h1>
          <p className="text-sm text-slate-500">Create events, create meetings, and start attendance sessions.</p>
        </div>
        {canManage && <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>Create Event / Meeting</Button>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Budget" value={`PKR ${totals.budget.toLocaleString()}`} />
        <StatCard label="Total Expense" value={`PKR ${totals.expense.toLocaleString()}`} />
        <StatCard label="Total Income" value={`PKR ${totals.income.toLocaleString()}`} />
        <StatCard label="Net P/L" value={`PKR ${(totals.income - totals.expense).toLocaleString()}`} />
      </div>

      <Section title="Upcoming Events" items={upcomingEvents} canManage={canManage} onEdit={openEdit} onDelete={deleteEvent} onDuplicate={duplicateEvent} onArchive={archiveEvent} onStartAttendance={(id: string) => navigate(`/app/attendance?eventId=${id}`)} />
      <Section title="Upcoming Meetings" items={upcomingMeetings} canManage={canManage} onEdit={openEdit} onDelete={deleteEvent} onDuplicate={duplicateEvent} onArchive={archiveEvent} onStartAttendance={(id: string) => navigate(`/app/attendance?eventId=${id}`)} />
      <Section title="Past Events / Meetings" items={pastItems} canManage={canManage} onEdit={openEdit} onDelete={deleteEvent} onDuplicate={duplicateEvent} onArchive={archiveEvent} onStartAttendance={(id: string) => navigate(`/app/attendance?eventId=${id}`)} />
      <Section title="Archived" items={archived} canManage={canManage} onEdit={openEdit} onDelete={deleteEvent} onDuplicate={duplicateEvent} onArchive={archiveEvent} onStartAttendance={(id: string) => navigate(`/app/attendance?eventId=${id}`)} />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Event / Meeting" : "Create Event / Meeting"} size="lg">
        <div className="space-y-4">
          <div><Label>Title</Label><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={form.type || "event"} onChange={(e) => setForm({ ...form, type: e.target.value as "event" | "meeting" })}>
                <option value="event">Event</option>
                <option value="meeting">Meeting</option>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date ? form.date.slice(0, 10) : ""} onChange={(e) => setForm({ ...form, date: `${e.target.value}T${(form.date?.slice(11, 16) || "09:00")}` })} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={form.date ? form.date.slice(11, 16) : "09:00"} onChange={(e) => setForm({ ...form, date: `${(form.date?.slice(0, 10) || new Date().toISOString().slice(0, 10))}T${e.target.value}` })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Venue</Label><Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label>Capacity</Label><Input type="number" value={form.capacity || 0} onChange={(e) => setForm({ ...form, capacity: +e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Budget</Label><Input type="number" value={form.budget || 0} onChange={(e) => setForm({ ...form, budget: +e.target.value })} /></div>
            <div><Label>Income</Label><Input type="number" value={form.income || 0} onChange={(e) => setForm({ ...form, income: +e.target.value })} /></div>
            <div><Label>Expense</Label><Input type="number" value={form.expense || 0} onChange={(e) => setForm({ ...form, expense: +e.target.value })} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return <Card className="p-4"><p className="text-xs uppercase text-slate-500">{label}</p><p className="text-xl font-bold mt-1">{value}</p></Card>;
}

function Section({ title, items, canManage, onEdit, onDelete, onDuplicate, onArchive, onStartAttendance }: any) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">{title}</h2>
      {items.length === 0 ? <p className="text-sm text-slate-500">No records.</p> : null}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((e: Event) => (
          <Card key={e.id} className="p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Badge tone={(e.type || "event") === "meeting" ? "amber" : "indigo"}>{(e.type || "event") === "meeting" ? "Meeting" : "Event"}</Badge>
              <Badge tone={e.status === "Completed" ? "emerald" : e.status === "Archived" ? "slate" : "sky"}>{e.status}</Badge>
            </div>
            <h3 className="font-semibold text-lg">{e.title}</h3>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{e.description}</p>
            <div className="mt-4 space-y-1 text-xs text-slate-500">
              <p className="flex items-center gap-2"><CalendarDays className="h-3 w-3" /> {new Date(e.date).toLocaleString()}</p>
              <p className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {e.location}</p>
              <p className="flex items-center gap-2"><Users2 className="h-3 w-3" /> {e.registered}/{e.capacity} registered · {e.attended} attended</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg bg-slate-100 dark:bg-white/5 p-2"><p className="text-[10px] uppercase text-slate-500">Budget</p><p className="font-bold">{e.budget}</p></div>
              <div className="rounded-lg bg-slate-100 dark:bg-white/5 p-2"><p className="text-[10px] uppercase text-slate-500">Inc</p><p className="font-bold">{e.income}</p></div>
              <div className="rounded-lg bg-slate-100 dark:bg-white/5 p-2"><p className="text-[10px] uppercase text-slate-500">Exp</p><p className="font-bold">{e.expense}</p></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => onStartAttendance(e.id)}>Start Attendance</Button>
              {canManage && <Button size="sm" variant="ghost" onClick={() => onEdit(e)}><Pencil className="h-3 w-3" /></Button>}
              {canManage && <Button size="sm" variant="ghost" onClick={() => onDuplicate(e.id)}><Copy className="h-3 w-3" /></Button>}
              {canManage && <Button size="sm" variant="ghost" onClick={() => onArchive(e.id)}><Archive className="h-3 w-3" /></Button>}
              {canManage && <Button size="sm" variant="ghost" onClick={() => onDelete(e.id)}><Trash2 className="h-3 w-3" /></Button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
