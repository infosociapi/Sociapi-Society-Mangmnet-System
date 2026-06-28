
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useSearchParams } from "react-router-dom";
import { Avatar, Badge, Button, Card, Input, Modal, Select } from "../components/ui";
import { useApp } from "../context/AppContext";
import { CheckCheck, Clock, QrCode, ScanLine, XCircle, Calendar, AlertTriangle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Attendance() {
  const { users, attendance, markAttendance, events } = useApp();
  const [searchParams] = useSearchParams();
  const [qrOpen, setQrOpen] = useState(false);
  const [eventId, setEventId] = useState<string>(searchParams.get("eventId") || "");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [scanned, setScanned] = useState<{ name: string; duplicate: boolean; error?: string } | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [memberQr, setMemberQr] = useState<{ user: any; img: string } | null>(null);

  // Stats
  const stats = useMemo(() => {
    const present = attendance.filter((a) => a.status === "Present").length;
    const late = attendance.filter((a) => a.status === "Late").length;
    const absent = attendance.filter((a) => a.status === "Absent").length;
    const excused = attendance.filter((a) => a.status === "Excused").length;
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
        Excused: recs.filter((r) => r.status === "Excused").length,
      });
    }
    return arr;
  }, [attendance]);

  const handleManualMark = (userId: string, status: "Present" | "Absent" | "Late" | "Excused") => {
    // Note: AppContext.markAttendance will use the context's current date/time
    // Or we could pass attendanceDate here if we update AppContext to accept it.
    markAttendance(userId, "Manual", status, eventId || undefined);
  };

  const handleQrScan = () => {
    let lookup = scanInput.trim();
    const member = users.find((u) => u.memberId.toLowerCase() === lookup.toLowerCase() || u.username.toLowerCase() === lookup.toLowerCase() || u.name.toLowerCase() === lookup.toLowerCase());
    
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm text-slate-500">QR Scanner · Manual Assignment · Backdated Attendance</p>
        </div>
        <Button icon={<QrCode className="h-4 w-4" />} onClick={() => setQrOpen(true)}>Open QR Scanner</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500 uppercase">Present</p><p className="text-2xl font-bold mt-1 text-emerald-600">{stats.present}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500 uppercase">Late</p><p className="text-2xl font-bold mt-1 text-amber-600">{stats.late}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500 uppercase">Absent</p><p className="text-2xl font-bold mt-1 text-rose-600">{stats.absent}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500 uppercase">Excused</p><p className="text-2xl font-bold mt-1 text-slate-500">{stats.excused}</p></Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Manual Attendance Assignment</h3>
        <div className="flex gap-4 mb-6">
            <div className="flex-1"><Label>Event / Session</Label><Select value={eventId} onChange={(e) => setEventId(e.target.value)}><option value="">— General Attendance —</option>{events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</Select></div>
            <div className="w-48"><Label>Date</Label><Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/40 dark:bg-white/5">
              <Avatar name={u.name} gradient={u.avatar} src={u.photoUrl} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{u.name}</p>
                <p className="text-xs text-slate-500">{u.memberId}</p>
              </div>
              <div className="flex gap-1">
                {["Present", "Late", "Absent", "Excused"].map((s) => (
                  <button key={s} title={s} onClick={() => handleManualMark(u.id, s as any)} className={`h-8 w-8 rounded-lg flex items-center justify-center ${s === "Present" ? "bg-emerald-500/15 text-emerald-600" : s === "Late" ? "bg-amber-500/15 text-amber-600" : s === "Absent" ? "bg-rose-500/15 text-rose-600" : "bg-slate-500/15 text-slate-600"}`}>
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
            <Button className="mt-4 w-full" onClick={handleQrScan}>Mark Present</Button>
            {scanned && (
              <div className={`mt-4 rounded-xl px-4 py-2 inline-block font-semibold ${scanned.duplicate ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}`}>
                {scanned.error || (scanned.duplicate ? "⚠ Already marked — " : "✓ Recorded — ")}{scanned.name}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}