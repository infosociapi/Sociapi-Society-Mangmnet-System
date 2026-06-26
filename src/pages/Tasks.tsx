import { useEffect, useMemo, useState } from "react";
import { Avatar, Badge, Button, Card, Input, Label, Modal, Select, Textarea } from "../components/ui";
import { useApp } from "../context/AppContext";
import type { Task, TaskStatus } from "../types";
import { AlertTriangle, Calendar, CheckCircle2, FileUp, Flag, Plus, Send, Timer, Users2, ShieldCheck, MessageSquare } from "lucide-react";
import { uploadToSupabaseStorage } from "../lib/supabaseStore";

const STATUSES: TaskStatus[] = ["Assigned", "In Progress", "Submitted", "Under Review", "Approved", "Completed", "Overdue"];

export default function Tasks() {
  const { tasks, users, updateTask, deleteTask, hasPermission, addNotification, currentUser, isSuperAdmin } = useApp();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("All");
  const [editing, setEditing] = useState<Task | null>(null);
  const [submitFor, setSubmitFor] = useState<Task | null>(null);
  const [reviewFor, setReviewFor] = useState<Task | null>(null);
  const canManage = hasPermission("manage_tasks");

  const visibleTasks = canManage ? tasks : tasks.filter((t) => currentUser && t.assignees.includes(currentUser.id));
  const enhanced = useMemo(() => {
    return visibleTasks.map((t) => {
      const days = Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 86400000);
      let auto: string | null = null;
      if (t.status !== "Completed") {
        if (days >= 10) auto = "Escalated to Super Admin (10d)";
        else if (days >= 7) auto = "Escalated to Lead (7d)";
        else if (days >= 5) auto = "Warning Notification (5d)";
        else if (days >= 3) auto = "Second Reminder (3d)";
        else if (days >= 1) auto = "Email Reminder (1d)";
      }
      return { ...t, daysSinceAssign: days, auto };
    });
  }, [visibleTasks]);

  const filtered = filter === "All" ? enhanced : enhanced.filter((t) => t.status === filter);

  const stats = {
    total: visibleTasks.length,
    pending: visibleTasks.filter((t) => t.status === "Assigned").length,
    inProg: visibleTasks.filter((t) => t.status === "In Progress").length,
    review: visibleTasks.filter((t) => t.status === "Under Review").length,
    completed: visibleTasks.filter((t) => t.status === "Completed").length,
    overdue: visibleTasks.filter((t) => t.status === "Overdue").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-slate-500">Assign · Submit · Review · Approve · Automate</p>
        </div>
        {canManage && <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setOpen(true); }}>Create Task</Button>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { l: "Total", v: stats.total }, { l: "Assigned", v: stats.pending }, { l: "In Progress", v: stats.inProg },
          { l: "Under Review", v: stats.review }, { l: "Completed", v: stats.completed }, { l: "Overdue", v: stats.overdue },
        ].map((s) => (
          <Card key={s.l} className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{s.l}</p>
            <p className="text-2xl font-bold mt-1">{s.v}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["All", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filter === s ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((t) => {
          const assignees = users.filter((u) => t.assignees.includes(u.id));
          const isAssignee = currentUser && t.assignees.includes(currentUser.id);
          return (
            <Card key={t.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{t.title}</h3>
                    <Badge tone={t.priority === "Critical" ? "rose" : t.priority === "High" ? "amber" : t.priority === "Medium" ? "sky" : "slate"}>
                      <Flag className="h-3 w-3" /> {t.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                </div>
                <Badge tone={t.status === "Overdue" ? "rose" : t.status === "Completed" || t.status === "Approved" ? "emerald" : t.status === "Under Review" || t.status === "Submitted" ? "violet" : t.status === "In Progress" ? "sky" : "amber"}>
                  {t.status}
                </Badge>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 flex-wrap text-xs">
                <div className="flex items-center gap-3 text-slate-500">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(t.deadline).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {t.daysSinceAssign}d old</span>
                  <span className="flex items-center gap-1"><Users2 className="h-3 w-3" /> {assignees.length}</span>
                </div>
                <div className="flex -space-x-2">
                  {assignees.slice(0, 4).map((u) => (
                    <div key={u.id} className="ring-2 ring-white dark:ring-slate-900 rounded-full">
                      <Avatar name={u.name} gradient={u.avatar} size={28} />
                    </div>
                  ))}
                </div>
              </div>

              {t.auto && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs ring-1 ring-amber-500/20">
                  <AlertTriangle className="h-4 w-4" /> Automation: <span className="font-semibold">{t.auto}</span>
                </div>
              )}

              {t.submission && (
                <div className="mt-3 px-3 py-2 rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20 text-xs">
                  <p className="font-semibold flex items-center gap-1"><FileUp className="h-3 w-3" /> Submission: {t.submission.fileName}</p>
                  <p className="text-slate-500 mt-1">{t.submission.notes}</p>
                </div>
              )}
              {t.remarks && (
                <div className="mt-2 px-3 py-2 rounded-xl bg-sky-500/10 ring-1 ring-sky-500/20 text-xs">
                  <p className="font-semibold flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Remarks</p>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">{t.remarks}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {canManage && (
                  <Button size="sm" variant="outline" onClick={() => { setEditing(t); setOpen(true); }}>Edit</Button>
                )}
                {isAssignee && t.status === "Assigned" && (
                  <Button size="sm" onClick={() => updateTask(t.id, { status: "In Progress" })}>Start</Button>
                )}
                {isAssignee && (t.status === "In Progress" || t.status === "Assigned") && (
                  <Button size="sm" variant="primary" icon={<Send className="h-3 w-3" />} onClick={() => setSubmitFor(t)}>
                    Submit
                  </Button>
                )}
                {(canManage || isSuperAdmin()) && (t.status === "Submitted" || t.status === "Under Review") && (
                  <Button size="sm" variant="primary" icon={<ShieldCheck className="h-3 w-3" />} onClick={() => { updateTask(t.id, { status: "Under Review" }); setReviewFor({ ...t, status: "Under Review" }); }}>
                    Review & Approve
                  </Button>
                )}
                {(canManage || isSuperAdmin()) && t.status === "Approved" && (
                  <Button size="sm" variant="primary" icon={<CheckCircle2 className="h-3 w-3" />}
                    onClick={() => updateTask(t.id, { status: "Completed", approvedBy: currentUser?.id })}>
                    Mark Completed
                  </Button>
                )}
                {canManage && t.status !== "Completed" && t.status !== "Approved" && (
                  <Button size="sm" variant="ghost" icon={<CheckCircle2 className="h-3 w-3" />}
                    onClick={() => { updateTask(t.id, { status: "Completed", approvedBy: currentUser?.id }); addNotification({ title: "Task Completed", body: `${t.title} marked complete.`, channel: "In-App", type: "success" }); }}>
                    Force Complete
                  </Button>
                )}
                {canManage && (
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteTask(t.id); }}>Delete</Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <TaskFormModal open={open} onClose={() => setOpen(false)} editing={editing} />

      <SubmitModal task={submitFor} onClose={() => setSubmitFor(null)} />
      <ReviewModal task={reviewFor} onClose={() => setReviewFor(null)} />
    </div>
  );
}

function SubmitModal({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { updateTask, addNotification } = useApp();
  const [file, setFile] = useState<string>("");
  const [fileData, setFileData] = useState<string>("");
  const [fileType, setFileType] = useState<string>("");
  const [notes, setNotes] = useState("");
  useEffect(() => { setFile(""); setNotes(""); }, [task]);
  if (!task) return null;
  const submit = () => {
    updateTask(task.id, {
      status: "Submitted",
      submission: { fileName: file || "submission.pdf", submittedAt: new Date().toISOString(), notes, fileData, fileType },
    });
    addNotification({ title: "Task Submitted", body: `${task.title} submitted for review.`, channel: "Email", type: "info" });
    onClose();
  };
  return (
    <Modal open={!!task} onClose={onClose} title="Submit Task">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Task: <span className="font-semibold text-slate-800 dark:text-slate-200">{task.title}</span></p>
        <div>
          <Label>File Upload</Label>
          <label className="flex items-center gap-3 px-4 py-6 border-2 border-dashed border-slate-300 dark:border-white/15 rounded-xl cursor-pointer hover:border-indigo-500">
            <FileUp className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-500 flex-1">{file || "Click to choose a file…"}</span>
            <input
              type="file"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFile(f.name);
                setFileType(f.type || "application/octet-stream");
                try {
                  const url = await uploadToSupabaseStorage(`task-submissions/${task.id}/${Date.now()}-${f.name}`, f);
                  setFileData(url);
                } catch (error) {
                  alert(error instanceof Error ? error.message : "Supabase Storage upload failed");
                }
              }}
            />
          </label>
        </div>
        <div>
          <Label>Submission Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe your work, any blockers…" />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} icon={<Send className="h-4 w-4" />}>Submit for Review</Button>
      </div>
    </Modal>
  );
}

function ReviewModal({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { updateTask, currentUser, addNotification } = useApp();
  const [remarks, setRemarks] = useState("");
  useEffect(() => { setRemarks(task?.remarks || ""); }, [task]);
  if (!task) return null;
  const approve = () => {
    updateTask(task.id, { status: "Approved", remarks, approvedBy: currentUser?.id });
    addNotification({ title: "Task Approved", body: `${task.title} approved.`, channel: "Email", type: "success" });
    onClose();
  };
  const reject = () => {
    updateTask(task.id, { status: "In Progress", remarks });
    addNotification({ title: "Task Sent Back", body: `${task.title} needs revisions.`, channel: "Email", type: "warning" });
    onClose();
  };
  return (
    <Modal open={!!task} onClose={onClose} title="Review Submission">
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-white/5">
          <p className="text-sm font-semibold">{task.title}</p>
          {task.submission && (
            <div className="text-xs text-slate-500 mt-2 flex items-center justify-between gap-2">
              <span>📎 {task.submission.fileName} · submitted {new Date(task.submission.submittedAt).toLocaleString()}</span>
              {task.submission.fileData && (
                <a className="text-blue-600 hover:underline" href={task.submission.fileData} download={task.submission.fileName}>Download</a>
              )}
            </div>
          )}
          {task.submission?.notes && <p className="text-sm mt-2">{task.submission.notes}</p>}
        </div>
        <div>
          <Label>Review Remarks</Label>
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Feedback to the assignee…" />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="outline" onClick={reject}>Send Back</Button>
        <Button onClick={approve} icon={<ShieldCheck className="h-4 w-4" />}>Approve</Button>
      </div>
    </Modal>
  );
}

function TaskFormModal({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: Task | null }) {
  const { users, addTask, updateTask, currentUser } = useApp();
  const [form, setForm] = useState<Partial<Task>>(
    editing || {
      title: "",
      description: "",
      assignees: [],
      createdBy: currentUser?.id || "u1",
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      priority: "Medium",
    }
  );
  useEffect(() => {
    setForm(
      editing || {
        title: "",
        description: "",
        assignees: [],
        createdBy: currentUser?.id || "u1",
        deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        priority: "Medium",
      }
    );
  }, [editing, open, currentUser]);

  const toggleAssignee = (id: string) =>
    setForm((f) => ({
      ...f,
      assignees: (f.assignees || []).includes(id)
        ? f.assignees!.filter((x) => x !== id)
        : [...(f.assignees || []), id],
    }));

  const save = () => {
    if (!form.title) return;
    if (editing) updateTask(editing.id, form as Partial<Task>);
    else addTask(form as Omit<Task, "id" | "createdAt" | "status">);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Task" : "Create Task"} size="lg">
      <div className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Deadline</Label>
            <Input type="date" value={(form.deadline || "").slice(0, 10)} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={form.priority as string} onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}>
              <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
            </Select>
          </div>
        </div>
        <div>
          <Label>Assignees ({(form.assignees || []).length})</Label>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 p-2 space-y-1">
            {users.map((u) => (
              <label key={u.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/5 cursor-pointer">
                <input type="checkbox" checked={(form.assignees || []).includes(u.id)} onChange={() => toggleAssignee(u.id)} />
                <Avatar name={u.name} gradient={u.avatar} size={28} />
                <span className="text-sm flex-1">{u.name}</span>
                <Badge tone="slate">{u.role}</Badge>
              </label>
            ))}
          </div>
        </div>
        {editing && (
          <div>
            <Label>Remarks (admin notes)</Label>
            <Textarea value={form.remarks || ""} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save}>{editing ? "Save" : "Create"}</Button>
      </div>
    </Modal>
  );
}
