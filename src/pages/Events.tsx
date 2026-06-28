import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, Input, Label, Modal, Select, Textarea } from "../components/ui";
import { useApp } from "../context/AppContext";
import type { Event } from "../types";
import { Archive, Award, Calendar, Copy, DollarSign, MapPin, Pencil, Plus, Star, Trash2, TrendingDown, TrendingUp, Users2 } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [feedbackEvent, setFeedbackEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<Partial<Event>>(empty());
  const canManage = hasPermission("manage_events");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const isPastDate = (e: Event) => new Date(e.date) < startOfToday;

  const archived = events.filter((e) => e.status === "Archived");
  const past = events.filter((e) => e.status !== "Archived" && (e.status === "Completed" || isPastDate(e)));
  const upcoming = events.filter((e) => e.status !== "Archived" && !isPastDate(e) && e.status !== "Completed");

  const totals = useMemo(() => {
    const budget = events.reduce((s, e) => s + (e.budget || 0), 0);
    const expense = events.reduce((s, e) => s + (e.expense || 0), 0);
    const income = events.reduce((s, e) => s + (e.income || 0), 0);
    return { budget, expense, income, pl: income - expense };
  }, [events]);

  const openCreate = () => { setEditing(null); setForm(empty()); setOpen(true); };
  const openEdit = (e: Event) => { setEditing(e); setForm({ ...e, date: new Date(e.date).toISOString().slice(0, 16) }); setOpen(true); };

  const save = () => {
    if (!form.title) return;
    const eventDate = new Date(form.date as string);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const isPast = eventDate < startOfToday;
    let status = (form.status as Event["status"]) || "Upcoming";
    if (status !== "Archived") status = isPast ? "Completed" : "Upcoming";
    const payload = {
      title: form.title!,
      description: form.description || "",
      type: (form.type as Event["type"]) || "event",
      date: eventDate.toISOString(),
      location: form.location || "",
      capacity: Number(form.capacity || 0),
      registered: Number(form.registered || 0),
      attended: Number(form.attended || 0),
      status,
      feedback: form.feedback || [],
      budget: Number(form.budget || 0),
      expense: Number(form.expense || 0),
      income: Number(form.income || 0),
    };
    if (editing) updateEvent(editing.id, payload as Event);
    else addEvent(payload as Event);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-sm text-slate-500">Create, track budgets & P/L.</p>
        </div>
        {canManage && <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>Create Event</Button>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4"><p className="text-xs uppercase text-slate-500">Total Budget</p><p className="text-xl font-bold mt-1">PKR {totals.budget.toLocaleString()}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-slate-500">Total Expense</p><p className="text-xl font-bold mt-1 text-rose-600">PKR {totals.expense.toLocaleString()}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-slate-500">Total Income</p><p className="text-xl font-bold mt-1 text-emerald-600">PKR {totals.income.toLocaleString()}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-slate-500">Net P/L</p><p className={`text-xl font-bold mt-1 ${totals.pl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>PKR {totals.pl.toLocaleString()}</p></Card>
      </div>

      <Section title="Upcoming Events" tone="indigo">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {upcoming.filter(e => e.type === "event").map((e) => (
            <EventCard key={e.id} event={e} canManage={canManage} onEdit={() => openEdit(e)} onDelete={() => deleteEvent(e.id)} onDuplicate={() => duplicateEvent(e.id)} onArchive={() => archiveEvent(e.id)} onRegister={() => updateEvent(e.id, { registered: Math.min(e.capacity, e.registered + 1) })} onViewFeedback={() => setFeedbackEvent(e)} />
          ))}
        </div>
      </Section>
      <Section title="Upcoming Meetings" tone="teal">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {upcoming.filter(e => e.type === "meeting").map((e) => (
            <EventCard key={e.id} event={e} canManage={canManage} onEdit={() => openEdit(e)} onDelete={() => deleteEvent(e.id)} onDuplicate={() => duplicateEvent(e.id)} onArchive={() => archiveEvent(e.id)} onRegister={() => {}} onViewFeedback={() => setFeedbackEvent(e)} />
          ))}
        </div>
      </Section>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Event" : "Create Event"} size="lg">
        <div className="space-y-4">
          <div><Label>Title</Label><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type || "event"} onChange={(e) => setForm({ ...form, type: e.target.value as "event" | "meeting" })}>
                <option value="event">Event</option>
                <option value="meeting">Meeting</option>
              </Select>
            </div>
            <div><Label>Date & Time</Label><Input type="datetime-local" value={form.date ? form.date.slice(0, 16) : ""} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <div><Label>Venue / Location</Label><Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-6"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></div>
      </Modal>
    </div>
  );
}

function Section({ title, tone, children }: { title: string; tone: any; children: React.ReactNode }) {
  return <div><div className="flex items-center gap-2 mb-3"><h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h2><Badge tone={tone}>{title}</Badge></div>{children}</div>;
}

function EventCard({ event: e, canManage, onEdit, onDelete, onDuplicate, onArchive, onRegister, onViewFeedback }: any) {
  const navigate = useNavigate();
  return (
    <Card className="p-5">
      <h3 className="font-semibold">{e.title}</h3>
      <p className="text-xs text-slate-500">{new Date(e.date).toLocaleString()}</p>
      <div className="mt-4 flex gap-1.5 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => navigate(`/app/attendance?eventId=${e.id}`)}>Start Attendance</Button>
        {canManage && <Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="h-3 w-3" /></Button>}
      </div>
    </Card>
  );
}
