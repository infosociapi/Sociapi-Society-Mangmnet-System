import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useSearchParams } from "react-router-dom";
import { Avatar, Badge, Button, Card, Input, Label, Modal, Select } from "../components/ui";
import { useApp } from "../context/AppContext";
import { CheckCheck, Clock, QrCode, ScanLine, XCircle, Calendar, AlertTriangle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function AttendanceReport() {
  const { users, attendance, markAttendance, events } = useApp();
  const [searchParams] = useSearchParams();
  const [qrOpen, setQrOpen] = useState(false);
  const [eventId, setEventId] = useState<string>(searchParams.get("eventId") || "");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [scanned, setScanned] = useState<{ name: string; duplicate: boolean; error?: string } | null>(null);
  const [scanInput, setScanInput] = useState("");

  // Stats
  const stats = useMemo(() => {
    const present = attendance.filter((a) => a.status === "Present").length;
    const late = attendance.filter((a) => a.status === "Late").length;
    const absent = attendance.filter((a) => a.status === "Absent").length;
    const excused = attendance.filter((a: any) => a.status === "Excused").length;
    return { present, late, absent, excused };
  }, [attendance]);

  const last7 = useMemo(() => {
    const arr = [];
    for (let d = 6; d >= 0; d--) {
      const day = new Date(Date.now() - d * 86400000);
      const recs = attendance.filter((a) => new Date(a.date).toDateString() === day.toDateString());
      arr.push({
        day: day.toLocaleDateString("en", { weekday: "short" }),
        Present: recs.filter((r) => r.status === "Present").length,
        Late: recs.filter((r) => r.status === "Late").length,
        Absent: recs.filter((r) => r.status === "Absent").length,
        Excused: recs.filter((r: any) => r.status === "Excused").length,
      });
    }
    return arr;
  }, [attendance]);

  const methodBreakdown = useMemo(() => {
    const m: Record<string, number> = {};
    attendance.forEach((a) => (m[a.method] = (m[a.method] || 0) + 1));
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [attendance]);

  const handleManualMark = (userId: string, status: "Present" | "Absent" | "Late" | "Excused") => {
    markAttendance(userId, "Manual", status as any, eventId || undefined);
  };

  const handleQrScan = () => {
    let lookup = scanInput.trim();
    try {
      const parsed = JSON.parse(lookup);
      lookup = parsed.memberId || parsed.specialNumber || parsed.name || lookup;
    } catch {}
    const member = users.find(
      (u) =>
        u.memberId.toLowerCase() === lookup.toLowerCase() ||
        u.specialNumber.toLowerCase() === lookup.toLowerCase() ||
        u.username.toLowerCase() === lookup.toLowerCase() ||
        u.name.toLowerCase() === lookup.toLowerCase()
    );

    if (!member) {
      setScanned({ name: "Not found", duplicate: true, error: "Member not found" });
      setTimeout(() => setScanned(null), 2500);
      return;
    }

    const r = markAttendance(member.id, "QR", "Present", eventId || undefined);
    setScanned({ name: member.name, duplicate: !!r.duplicate });
    setTimeout(() => setScanned(null), 2500);
    setScanInput("");
  };

  useEffect(() => {
    if (events.length && !eventId) setEventId("");
  }, [events, eventId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Report</h1>
          <p className="text-sm text-slate-500">QR Scanner · Manual Assignment · Trends &amp; Breakdown</p>
        </div>
        <Button icon={<QrCode className="h-4 w-4" />} onClick={() => setQrOpen(true)}>
          Open QR Scanner
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500 uppercase">Present</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{stats.present}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 uppercase">Late</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{stats.late}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 uppercase">Absent</p>
          <p className="text-2xl font-bold mt-1 text-rose-600">{stats.absent}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 uppercase">Excused</p>
          <p className="text-2xl font-bold mt-1 text-slate-500">{stats.excused}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-semibold mb-4">Last 7 Days</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "none", borderRadius: 12, color: "#fff" }} />
                <Bar dataKey="Present" stackId="a" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Late" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Excused" stackId="a" fill="#64748b" />
                <Bar dataKey="Absent" stackId="a" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">By Method</h3>
          {methodBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No attendance records yet.</p>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={methodBreakdown} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75} paddingAngle={4}>
                      {methodBreakdown.map((_, i) => (
                        <Cell key={i} fill={["#6366f1", "#a855f7", "#10b981"][i % 3]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "none", borderRadius: 12, color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1 text-xs">
                {methodBreakdown.map((m, i) => (
                  <div key={m.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: ["#6366f1", "#a855f7", "#10b981"][i % 3] }} /> {m.name}
                    </span>
                    <span className="font-semibold">{m.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Manual Attendance Assignment</h3>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <Label>
              <Calendar className="h-3 w-3 inline mr-1" />
              Event / Session
            </Label>
            <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">— General Attendance —</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-48">
            <Label>Date</Label>
            <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/40 dark:bg-white/5">
              <Avatar name={u.name} gradient={u.avatar} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{u.name}</p>
                <p className="text-xs text-slate-500">{u.memberId}</p>
              </div>
              <div className="flex gap-1">
                {(["Present", "Late", "Absent", "Excused"] as const).map((s) => (
                  <button
                    key={s}
                    title={s}
                    onClick={() => handleManualMark(u.id, s)}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      s === "Present"
                        ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
                        : s === "Late"
                        ? "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25"
                        : s === "Absent"
                        ? "bg-rose-500/15 text-rose-600 hover:bg-rose-500/25"
                        : "bg-slate-500/15 text-slate-600 hover:bg-slate-500/25"
                    }`}
                  >
                    {s === "Present" ? <CheckCheck className="h-4 w-4" /> : s === "Late" ? <Clock className="h-4 w-4" /> : s === "Absent" ? <XCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="QR Attendance Scanner">
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="relative mx-auto h-56 w-56 rounded-3xl bg-slate-100 dark:bg-white/5 ring-2 ring-indigo-500/30 flex items-center justify-center overflow-hidden">
              <ScanLine className="h-20 w-20 text-indigo-500" />
            </div>
            <p className="mt-6 text-sm text-slate-500">Scan QR or paste Member ID/Username</p>
            <Input className="mt-2" value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="Enter Member ID or Username" />
            <Button className="mt-4 w-full" onClick={handleQrScan}>
              Mark Present
            </Button>
            {scanned && (
              <div className={`mt-4 rounded-xl px-4 py-2 inline-block font-semibold ${scanned.duplicate ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}`}>
                {scanned.error || (scanned.duplicate ? "⚠ Already marked — " : "✓ Recorded — ")}
                {scanned.name}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}