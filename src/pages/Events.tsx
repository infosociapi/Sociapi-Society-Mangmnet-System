import { useState, useMemo } from "react";
import { Badge, Button, Card, Input, Label, Modal, Textarea } from "../components/ui";
import { useApp } from "../context/AppContext";
import type { Event } from "../types";
import { Archive, Award, Calendar, Copy, DollarSign, MapPin, Pencil, Plus, Star, Trash2, TrendingDown, TrendingUp, Users2 } from "lucide-react";
import { uploadToSupabaseStorage } from "../lib/supabaseStore";

const empty = (): Partial<Event> => ({
  title: "",
  description: "",
  date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  location: "",
  capacity: 100,
  registered: 0,
  attended: 0,
  status: "Upcoming",
  feedback: [],
  budget: 0,
  expense: 0,
  income: 0,
  photos: [],
  documents: [],
});

export default function Events() {
  const { events, addEvent, updateEvent, deleteEvent, duplicateEvent, archiveEvent, hasPermission } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [feedbackEvent, setFeedbackEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<Partial<Event>>(empty());
  const canManage = hasPermission("manage_events");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const isPastDate = (e: Event) => new Date(e.date) < startOfToday;

  const archived = events.filter((e) => e.status === "Archived");
  // Past = explicitly Completed OR any non-archived event whose date has passed.
  const past = events.filter((e) => e.status !== "Archived" && (e.status === "Completed" || isPastDate(e)));
  // Upcoming = non-archived future events that are not already in past.
  const upcoming = events.filter((e) => e.status !== "Archived" && !isPastDate(e) && e.status !== "Completed");

  const totals = useMemo(() => {
    const budget = events.reduce((s, e) => s + (e.budget || 0), 0);
    const expense = events.reduce((s, e) => s + (e.expense || 0), 0);
    const income = events.reduce((s, e) => s + (e.income || 0), 0);
    return { budget, expense, income, pl: income - expense };
  }, [events]);

  const openCreate = () => { setEditing(null); setForm(empty()); setOpen(true); };
  const openEdit = (e: Event) => { setEditing(e); setForm({ ...e, date: new Date(e.date).toISOString().slice(0, 10) }); setOpen(true); };

  const save = () => {
    if (!form.title) return;
    const eventDate = new Date(form.date as string);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    // If the selected date is in the past, mark it Completed so it shows under Past Events.
    const isPast = eventDate < startOfToday;
    let status = (form.status as Event["status"]) || "Upcoming";
    if (status !== "Archived") status = isPast ? "Completed" : "Upcoming";
    const payload = {
      title: form.title!,
      description: form.description || "",
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
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-sm text-slate-500">Create · Edit · Duplicate · Archive · Track budgets & P/L</p>
        </div>
        {canManage && <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>Create Event</Button>}
      </div>

      {/* Finance totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4"><p className="text-xs uppercase text-slate-500">Total Budget</p><p className="text-xl font-bold mt-1">PKR {totals.budget.toLocaleString()}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-slate-500">Total Expense</p><p className="text-xl font-bold mt-1 text-rose-600">PKR {totals.expense.toLocaleString()}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-slate-500">Total Income</p><p className="text-xl font-bold mt-1 text-emerald-600">PKR {totals.income.toLocaleString()}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-slate-500">Net P/L</p><p className={`text-xl font-bold mt-1 ${totals.pl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>PKR {totals.pl.toLocaleString()}</p></Card>
      </div>

      <Section title="Upcoming" tone="indigo">
        {upcoming.length === 0 && <p className="text-sm text-slate-500">No upcoming events.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {upcoming.map((e) => (
            <EventCard key={e.id} event={e} canManage={canManage}
              onEdit={() => openEdit(e)}
              onDelete={() => { if (confirm("Delete event?")) deleteEvent(e.id); }}
              onDuplicate={() => duplicateEvent(e.id)}
              onArchive={() => archiveEvent(e.id)}
              onRegister={() => updateEvent(e.id, { registered: Math.min(e.capacity, e.registered + 1) })}
              onViewFeedback={() => setFeedbackEvent(e)}
            />
          ))}
        </div>
      </Section>

      <Section title="Past Events" tone="slate">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {past.map((e) => (
            <EventCard key={e.id} event={e} canManage={canManage}
              onEdit={() => openEdit(e)}
              onDelete={() => { if (confirm("Delete event?")) deleteEvent(e.id); }}
              onDuplicate={() => duplicateEvent(e.id)}
              onArchive={() => archiveEvent(e.id)}
              onRegister={() => {}}
              onViewFeedback={() => setFeedbackEvent(e)}
            />
          ))}
        </div>
      </Section>

      {archived.length > 0 && (
        <Section title="Archived" tone="amber">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {archived.map((e) => (
              <EventCard key={e.id} event={e} canManage={canManage}
                onEdit={() => openEdit(e)}
                onDelete={() => { if (confirm("Delete event?")) deleteEvent(e.id); }}
                onDuplicate={() => duplicateEvent(e.id)}
                onArchive={() => {}}
                onRegister={() => {}}
                onViewFeedback={() => setFeedbackEvent(e)}
              />
            ))}
          </div>
        </Section>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Event" : "Create Event"} size="lg">
        <div className="space-y-4">
          <div><Label>Title</Label><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input type="date" value={form.date as string} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label>Capacity</Label><Input type="number" value={form.capacity || 0} onChange={(e) => setForm({ ...form, capacity: +e.target.value })} /></div>
          </div>
          <div><Label>Venue / Location</Label><Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div className="rounded-xl bg-slate-100/60 dark:bg-white/5 p-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Event Finance</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Planned Budget (PKR)</Label>
                <Input type="number" value={form.budget || 0} onChange={(e) => setForm({ ...form, budget: +e.target.value })} placeholder="e.g. 40000" />
              </div>
              <div>
                <Label>Income / Sponsorship Received (PKR)</Label>
                <Input type="number" value={form.income || 0} onChange={(e) => setForm({ ...form, income: +e.target.value })} placeholder="e.g. 35000" />
              </div>
              <div>
                <Label>Total Expense / Kharch (PKR)</Label>
                <Input type="number" value={form.expense || 0} onChange={(e) => setForm({ ...form, expense: +e.target.value })} placeholder="e.g. 38000" />
              </div>
            </div>
            {(() => {
              const inc = Number(form.income || 0);
              const exp = Number(form.expense || 0);
              const pl = inc - exp;
              return (
                <div className={`text-sm font-semibold px-3 py-2 rounded-lg ${pl >= 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}>
                  Received: PKR {inc.toLocaleString()} · Spent: PKR {exp.toLocaleString()} · {pl >= 0 ? "Profit" : "Loss"}: PKR {Math.abs(pl).toLocaleString()}
                </div>
              );
            })()}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Upload Event Images</Label>
              <Input type="file" accept="image/*" multiple onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                try {
                  const imgs = await Promise.all(files.map((file) => uploadToSupabaseStorage(`event-images/${Date.now()}-${file.name}`, file)));
                  setForm((f) => ({ ...f, photos: [...(f.photos || []), ...imgs] }));
                } catch (error) {
                  alert(error instanceof Error ? error.message : "Supabase Storage upload failed");
                }
              }} />
              <p className="text-xs text-slate-500 mt-1">{(form.photos || []).length} image(s) uploaded</p>
            </div>
            <div>
              <Label>Upload Event Documents</Label>
              <Input type="file" multiple onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                try {
                  const docs = await Promise.all(files.map(async (file) => ({
                    name: file.name,
                    data: await uploadToSupabaseStorage(`event-documents/${Date.now()}-${file.name}`, file),
                    type: file.type,
                  })));
                  setForm((f) => ({ ...f, documents: [...(f.documents || []), ...docs] }));
                } catch (error) {
                  alert(error instanceof Error ? error.message : "Supabase Storage upload failed");
                }
              }} />
              <p className="text-xs text-slate-500 mt-1">{(form.documents || []).length} document(s) uploaded</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save}>{editing ? "Save" : "Create"}</Button>
        </div>
      </Modal>

      <Modal open={!!feedbackEvent} onClose={() => setFeedbackEvent(null)} title="Event Feedback">
        {feedbackEvent && (
          <div className="space-y-3">
            {feedbackEvent.feedback.length === 0 && <p className="text-sm text-slate-500">No feedback yet.</p>}
            {feedbackEvent.feedback.map((f, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`h-4 w-4 ${j < f.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                  ))}
                </div>
                <p className="text-sm">{f.comment}</p>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Section({ title, tone, children }: { title: string; tone: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
        <Badge tone={tone}>{title}</Badge>
      </div>
      {children}
    </div>
  );
}

function EventCard({
  event: e, canManage,
  onEdit, onDelete, onDuplicate, onArchive, onRegister, onViewFeedback,
}: {
  event: Event; canManage: boolean;
  onEdit: () => void; onDelete: () => void; onDuplicate: () => void; onArchive: () => void;
  onRegister: () => void; onViewFeedback: () => void;
}) {
  const pl = (e.income || 0) - (e.expense || 0);
  const avg = e.feedback.length ? (e.feedback.reduce((s, f) => s + f.rating, 0) / e.feedback.length).toFixed(1) : "—";
  return (
    <Card className="p-5 relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full soc-bg-soft blur-2xl" />
      <Badge tone={e.status === "Upcoming" ? "indigo" : e.status === "Completed" ? "emerald" : "amber"} className="mb-2">{e.status}</Badge>
      <h3 className="font-semibold">{e.title}</h3>
      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{e.description}</p>
      <div className="mt-3 space-y-1.5 text-xs">
        <p className="flex items-center gap-2"><Calendar className="h-3 w-3 text-slate-400" /> {new Date(e.date).toLocaleString()}</p>
        <p className="flex items-center gap-2"><MapPin className="h-3 w-3 text-slate-400" /> {e.location || "TBA"}</p>
        <p className="flex items-center gap-2"><Users2 className="h-3 w-3 text-slate-400" /> {e.registered}/{e.capacity} registered · {e.attended} attended</p>
      </div>
      {(e.photos?.length || e.documents?.length) && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {e.photos?.length ? <Badge tone="sky">{e.photos.length} photo(s)</Badge> : null}
          {e.documents?.length ? <Badge tone="violet">{e.documents.length} document(s)</Badge> : null}
        </div>
      )}
      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded-lg bg-slate-100/60 dark:bg-white/5 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-500"><DollarSign className="h-3 w-3 inline" /> Budget</p>
          <p className="text-xs font-bold">{(e.budget || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-rose-500/10 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wider text-rose-600"><TrendingDown className="h-3 w-3 inline" /> Exp</p>
          <p className="text-xs font-bold">{(e.expense || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-emerald-500/10 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wider text-emerald-600"><TrendingUp className="h-3 w-3 inline" /> Inc</p>
          <p className="text-xs font-bold">{(e.income || 0).toLocaleString()}</p>
        </div>
      </div>
      <div className={`mt-2 text-xs font-semibold text-center px-2 py-1 rounded-lg ${pl >= 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}>
        Net P/L: PKR {pl.toLocaleString()}
      </div>
      {e.status === "Completed" && (
        <div className="mt-2 flex items-center justify-center gap-3 text-xs">
          <span className="flex items-center gap-1">{avg} <Star className="h-3 w-3 text-amber-500" /></span>
          <span className="flex items-center gap-1"><Award className="h-3 w-3 text-amber-500" /> {e.attended} certs</span>
        </div>
      )}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {e.status === "Upcoming" && (
                  <>
                    <Button size="sm" onClick={onRegister}>+ Register</Button>
                    <Button size="sm" variant="outline" onClick={() => window.location.href = `/app/attendance?eventId=${e.id}`}>Start Attendance</Button>
                  </>
                )}
        {e.status === "Completed" && <Button size="sm" variant="outline" onClick={onViewFeedback}>Feedback</Button>}
        {canManage && (
          <>
            <Button size="sm" variant="ghost" icon={<Pencil className="h-3 w-3" />} onClick={onEdit}>Edit</Button>
            <Button size="sm" variant="ghost" icon={<Copy className="h-3 w-3" />} onClick={onDuplicate}>Dup</Button>
            {e.status !== "Archived" && <Button size="sm" variant="ghost" icon={<Archive className="h-3 w-3" />} onClick={onArchive}>Archive</Button>}
            <Button size="sm" variant="ghost" icon={<Trash2 className="h-3 w-3" />} onClick={onDelete}>Del</Button>
          </>
        )}
      </div>
    </Card>
  );
}
