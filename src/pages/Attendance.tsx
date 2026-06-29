import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useSearchParams } from "react-router-dom";
import { Avatar, Badge, Button, Card, Input, Label, Modal, Select } from "../components/ui";
import { useApp } from "../context/AppContext";
import { CheckCheck, Clock, QrCode, ScanLine, ShieldAlert, XCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Attendance() {
  const { users, attendance, markAttendance, events } = useApp();
  const [searchParams] = useSearchParams();
  const [qrOpen, setQrOpen] = useState(false);
  const [eventId, setEventId] = useState<string>(searchParams.get("eventId") || "");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [scanInput, setScanInput] = useState("");
  const [scanned, setScanned] = useState<{ name: string; duplicate: boolean; error?: string } | null>(null);
  const [memberQr, setMemberQr] = useState<{ user: any; img: string } | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm text-slate-500">
            Manual, QR, backdated event and meeting attendance.
          </p>
        </div>
        <Button icon={<QrCode className="h-4 w-4" />} onClick={() => setQrOpen(true)}>
          Open QR Scanner
        </Button>
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
    </div>
  );
}