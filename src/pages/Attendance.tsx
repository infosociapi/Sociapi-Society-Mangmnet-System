import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useSearchParams } from "react-router-dom";
import { Avatar, Badge, Button, Card, Input, Label, Modal, Select } from "../components/ui";
import { useApp } from "../context/AppContext";
import { CheckCheck, Clock, ListFilter, Pencil, QrCode, ScanLine, ShieldAlert, Trash2, XCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Attendance() {
  const { users, attendance, markAttendance, updateAttendanceRecord, deleteAttendanceRecord, events } = useApp();
  const [searchParams] = useSearchParams();
  const [qrOpen, setQrOpen] = useState(false);
  const [eventId, setEventId] = useState<string>(searchParams.get("eventId") || "");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [scanInput, setScanInput] = useState("");
  const [scanned, setScanned] = useState<{ name: string; duplicate: boolean; error?: string } | null>(null);
  const [memberQr, setMemberQr] = useState<{ user: any; img: string } | null>(null);

  // --- Edit Attendance panel state ---
  const [editOpen, setEditOpen] = useState(false);
  const [editUserFilter, setEditUserFilter] = useState<string>("All");
  const [editFrom, setEditFrom] = useState<string>("");
  const [editTo, setEditTo] = useState<string>("");
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  useEffect(() => {
    if (events.length && !eventId) setEventId(events[0].id);
  }, [events, eventId]);

  const stats = useMemo(() => {
    const todayKey = new Date().toDateString();
    const today = attendance.filter((a) => new Date(a.date).toDateString() === todayKey);
    return {
      presentToday: today.filter((a) => a.status === "Present").length,
      lateToday: today.filter((a) => a.status === "Late").length,
      absentToday: today.filter((a) => a.status === "Absent").length,
      excusedToday: today.filter((a) => a.status === "Excused").length,
    };
  }, [attendance]);

  const trend = useMemo(() => {
    const arr = [];
    for (let d = 6; d >= 0; d--) {
      const day = new Date(Date.now() - d * 86400000);
      const recs = attendance.filter((a) => new Date(a.date).toDateString() === day.toDateString());
      arr.push({
        day: day.toLocaleDateString("en", { weekday: "short" }),
        Present: recs.filter((r) => r.status === "Present").length,
        Late: recs.filter((r) => r.status === "Late").length,
        Absent: recs.filter((r) => r.status === "Absent").length,
        Excused: recs.filter((r) => r.status === "Excused").length,
      });
    }
    return arr;
  }, [attendance]);

  const methodBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    attendance.forEach((a) => {
      map[a.method] = (map[a.method] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [attendance]);

  const handleManualMark = (userId: string, status: "Present" | "Absent" | "Late" | "Excused") => {
    markAttendance(userId, "Manual", status, eventId || undefined, new Date(attendanceDate).toISOString());
  };

  const handleQrScan = () => {
    let lookup = scanInput.trim();

    try {
      const parsed = JSON.parse(lookup);
      lookup = parsed.memberId || parsed.username || lookup;
    } catch {
      // not JSON, continue as raw memberId/username
    }

    const member = users.find(
      (u) =>
        u.memberId.toLowerCase() === lookup.toLowerCase() ||
        u.username.toLowerCase() === lookup.toLowerCase()
    );

    if (!member) {
      setScanned({ name: "Not found", duplicate: true, error: "Member not found" });
      setTimeout(() => setScanned(null), 2500);
      return;
    }

    const r = markAttendance(
      member.id,
      "QR",
      "Present",
      eventId || undefined,
      new Date(attendanceDate).toISOString()
    );

    setScanned({ name: member.name, duplicate: !!r.duplicate });
    setTimeout(() => setScanned(null), 2500);
    setScanInput("");
  };

  const showMemberQr = async (u: any) => {
    const secureUrl = `${window.location.origin}${window.location.pathname}#/member/${u.memberId}`;
    const img = await QRCode.toDataURL(secureUrl, { width: 256, margin: 1 });
    setMemberQr({ user: u, img });
  };

  const editFilteredRecords = useMemo(() => {
    return [...attendance]
      .filter((a) => {
        if (editUserFilter !== "All" && a.userId !== editUserFilter) return false;
        if (editFrom && new Date(a.date) < new Date(editFrom)) return false;
        if (editTo && new Date(a.date) > new Date(editTo + "T23:59:59")) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, editUserFilter, editFrom, editTo]);

  const userName = (id: string) => users.find((u) => u.id === id)?.name || "Unknown member";
  const eventName = (id?: string) => (id ? events.find((e) => e.id === id)?.title : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm text-slate-500">
            Manual, QR, backdated event and meeting attendance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<ListFilter className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
            Edit Attendance
          </Button>
          <Button icon={<QrCode className="h-4 w-4" />} onClick={() => setQrOpen(true)}>
            Open QR Scanner
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs uppercase text-slate-500">Present Today</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.presentToday}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-slate-500">Late Today</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.lateToday}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-slate-500">Absent Today</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{stats.absentToday}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-slate-500">Excused Today</p>
          <p className="text-2xl font-bold text-slate-600 mt-1">{stats.excusedToday}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-semibold mb-4">Attendance Trend</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,23,42,0.95)",
                    border: "none",
                    borderRadius: 12,
                    color: "#fff",
                  }}
                />
                <Bar dataKey="Present" fill="#10b981" />
                <Bar dataKey="Late" fill="#f59e0b" />
                <Bar dataKey="Absent" fill="#ef4444" />
                <Bar dataKey="Excused" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">By Method</h3>
          {methodBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-12">No attendance yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={methodBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                    {methodBreakdown.map((_, i) => (
                      <Cell key={i} fill={["#14B8A6", "#8b5cf6", "#f59e0b"][i % 3]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.95)",
                      border: "none",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label>Date</Label>
            <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
          </div>

          <div>
            <Label>Event / Meeting</Label>
            <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">General attendance</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} — {new Date(e.date).toLocaleString()}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-end">
            <div className="text-xs text-slate-500 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 w-full">
              Admin can mark or edit attendance for any past date.
            </div>
          </div>
        </div>

        <h3 className="font-semibold mb-4">Manual Attendance & Member QR</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/40 dark:bg-white/5">
              <Avatar name={u.name} gradient={u.avatar} src={u.photoUrl} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{u.name}</p>
                <p className="text-xs text-slate-500">{u.memberId}</p>
              </div>
              <div className="flex gap-1">
                <button
                  title="Show QR"
                  onClick={() => showMemberQr(u)}
                  className="h-8 w-8 rounded-lg bg-indigo-500/15 text-indigo-600 hover:bg-indigo-500/25 flex items-center justify-center"
                >
                  <QrCode className="h-4 w-4" />
                </button>
                <button
                  title="Present"
                  onClick={() => handleManualMark(u.id, "Present")}
                  className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 flex items-center justify-center"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
                <button
                  title="Late"
                  onClick={() => handleManualMark(u.id, "Late")}
                  className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 flex items-center justify-center"
                >
                  <Clock className="h-4 w-4" />
                </button>
                <button
                  title="Absent"
                  onClick={() => handleManualMark(u.id, "Absent")}
                  className="h-8 w-8 rounded-lg bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 flex items-center justify-center"
                >
                  <XCircle className="h-4 w-4" />
                </button>
                <button
                  title="Excused"
                  onClick={() => handleManualMark(u.id, "Excused")}
                  className="h-8 w-8 rounded-lg bg-slate-500/15 text-slate-600 hover:bg-slate-500/25 flex items-center justify-center"
                >
                  <ShieldAlert className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="QR Attendance Scanner">
        <div className="space-y-4">
          <div>
            <Label>Attendance Date</Label>
            <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
          </div>

          <div>
            <Label>Event / Meeting</Label>
            <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">General attendance</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="text-center py-4">
            <div className="relative mx-auto h-56 w-56 rounded-3xl soc-bg-soft ring-2 ring-indigo-500/30 flex items-center justify-center overflow-hidden">
              <ScanLine className="h-20 w-20 text-indigo-500" />
              <div className="absolute inset-x-4 top-1/2 h-1 bg-teal-500 shimmer" />
            </div>
            <p className="mt-6 text-sm text-slate-500">Paste QR payload or type Member ID / Username</p>
            <div className="mt-4 max-w-md mx-auto text-left">
              <Input value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="Member ID or Username" />
            </div>
            <Button className="mt-4" onClick={handleQrScan}>
              Mark Present
            </Button>

            {scanned && (
              <div
                className={`mt-4 rounded-xl px-4 py-2 inline-block font-semibold ${
                  scanned.duplicate
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {scanned.error || (scanned.duplicate ? "⚠ Duplicate prevented — " : "✓ Recorded — ")}
                {scanned.name}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal open={!!memberQr} onClose={() => setMemberQr(null)} title="Member QR Code">
        {memberQr && (
          <div className="text-center py-6">
            <Avatar name={memberQr.user.name} gradient={memberQr.user.avatar} src={memberQr.user.photoUrl} size={72} />
            <p className="font-semibold mt-3">{memberQr.user.name}</p>
            <p className="text-xs text-slate-500 mb-4 flex justify-center gap-2 mt-1">
              <Badge tone="indigo">{memberQr.user.memberId}</Badge>
            </p>
            <img src={memberQr.img} alt="Member QR" className="mx-auto rounded-xl shadow-md" />
            <p className="text-xs text-slate-500 mt-4">Display this QR to admins for event/meeting attendance.</p>
          </div>
        )}
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Attendance Records" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Member</Label>
              <Select value={editUserFilter} onChange={(e) => setEditUserFilter(e.target.value)}>
                <option value="All">All members</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>From</Label>
              <Input type="date" value={editFrom} onChange={(e) => setEditFrom(e.target.value)} />
            </div>
            <div>
              <Label>To</Label>
              <Input type="date" value={editTo} onChange={(e) => setEditTo(e.target.value)} />
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-white/5 text-xs uppercase tracking-wider text-slate-500 sticky top-0">
                <tr>
                  <th className="text-left p-3">Member</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Event</th>
                  <th className="text-left p-3">Method</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {editFilteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">No attendance records match this filter.</td>
                  </tr>
                )}
                {editFilteredRecords.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="p-3 font-semibold">{userName(a.userId)}</td>
                    <td className="p-3 text-slate-500">{new Date(a.date).toLocaleString()}</td>
                    <td className="p-3 text-slate-500">{eventName(a.eventId) || "General"}</td>
                    <td className="p-3"><Badge tone="slate">{a.method}</Badge></td>
                    <td className="p-3">
                      <Badge tone={a.status === "Present" ? "emerald" : a.status === "Late" ? "amber" : a.status === "Excused" ? "slate" : "rose"}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" icon={<Pencil className="h-3 w-3" />} onClick={() => setEditingRecord(a)}>Edit</Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Trash2 className="h-3 w-3" />}
                          onClick={() => {
                            if (confirm(`Delete this attendance record for ${userName(a.userId)}?`)) deleteAttendanceRecord(a.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setEditOpen(false)}>Close</Button>
        </div>
      </Modal>

      <Modal open={!!editingRecord} onClose={() => setEditingRecord(null)} title="Edit Attendance Record">
        {editingRecord && (
          <EditRecordForm
            record={editingRecord}
            memberName={userName(editingRecord.userId)}
            onSave={(patch) => {
              updateAttendanceRecord(editingRecord.id, patch);
              setEditingRecord(null);
            }}
            onCancel={() => setEditingRecord(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function EditRecordForm({
  record,
  memberName,
  onSave,
  onCancel,
}: {
  record: { id: string; date: string; status: "Present" | "Absent" | "Late" | "Excused"; method: string };
  memberName: string;
  onSave: (patch: { status: "Present" | "Absent" | "Late" | "Excused"; date: string }) => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState<"Present" | "Absent" | "Late" | "Excused">(record.status);
  const [date, setDate] = useState(new Date(record.date).toISOString().slice(0, 16));

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Editing record for <span className="font-semibold text-slate-800 dark:text-slate-200">{memberName}</span></p>
      <div>
        <Label>Date & Time</Label>
        <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <Label>Status</Label>
        <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
          <option value="Present">Present</option>
          <option value="Late">Late</option>
          <option value="Absent">Absent</option>
          <option value="Excused">Excused</option>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ status, date: new Date(date).toISOString() })}>Save Changes</Button>
      </div>
    </div>
  );
}