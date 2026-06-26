import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Avatar, Badge, Button, Card, Input, Modal, Select } from "../components/ui";
import { useApp } from "../context/AppContext";
import { CheckCheck, Clock, QrCode, ScanLine, XCircle, Calendar } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Attendance() {
  const { users, attendance, markAttendance, events } = useApp();
  const [qrOpen, setQrOpen] = useState(false);
  const [eventId, setEventId] = useState<string>("");
  const [scanned, setScanned] = useState<{ name: string; duplicate: boolean } | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [memberQr, setMemberQr] = useState<{ user: any; img: string } | null>(null);

  const today = new Date().toDateString();
  const todayRecs = attendance.filter((a) => new Date(a.date).toDateString() === today);
  const presentToday = todayRecs.filter((r) => r.status === "Present").length;
  const lateToday = todayRecs.filter((r) => r.status === "Late").length;
  const absentToday = users.length - todayRecs.length;

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
      });
    }
    return arr;
  }, [attendance]);

  const methodBreakdown = useMemo(() => {
    const m: Record<string, number> = {};
    attendance.forEach((a) => (m[a.method] = (m[a.method] || 0) + 1));
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [attendance]);

  const monthlyRate = useMemo(() => {
    let present = 0, total = 0;
    attendance.forEach((a) => {
      const ageDays = (Date.now() - new Date(a.date).getTime()) / 86400000;
      if (ageDays <= 30) {
        total++;
        if (a.status === "Present") present++;
      }
    });
    return total ? Math.round((present / total) * 100) : 0;
  }, [attendance]);

  const handleQrScan = () => {
    let lookup = scanInput.trim();
    try {
      const parsed = JSON.parse(lookup);
      lookup = parsed.memberId || parsed.specialNumber || parsed.name || lookup;
    } catch {}
    const member = users.find((u) =>
      u.memberId.toLowerCase() === lookup.toLowerCase() ||
      u.specialNumber.toLowerCase() === lookup.toLowerCase() ||
      u.username.toLowerCase() === lookup.toLowerCase() ||
      u.name.toLowerCase() === lookup.toLowerCase()
    );
    if (!member) {
      setScanned({ name: "Member not found", duplicate: true });
      setTimeout(() => setScanned(null), 2500);
      return;
    }
    const r = markAttendance(member.id, "QR", "Present", eventId || undefined);
    setScanned({ name: member.name, duplicate: !!r.duplicate });
    setTimeout(() => setScanned(null), 2500);
  };

  const showMemberQr = async (u: any) => {
    const payload = JSON.stringify({ memberId: u.memberId, specialNumber: u.specialNumber, username: u.username, name: u.name, org: "Sociapi Society ERP" });
    const img = await QRCode.toDataURL(payload, { width: 256, margin: 1 });
    setMemberQr({ user: u, img });
  };

  useEffect(() => {
    if (events.length && !eventId) setEventId(events[0].id);
  }, [events, eventId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm text-slate-500">QR Attendance · Manual · Event-scoped · Analytics · Monthly Reports</p>
        </div>
        <Button icon={<QrCode className="h-4 w-4" />} onClick={() => setQrOpen(true)}>Open QR Scanner</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500 uppercase">Present Today</p><p className="text-2xl font-bold mt-1 text-emerald-600">{presentToday}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500 uppercase">Late Today</p><p className="text-2xl font-bold mt-1 text-amber-600">{lateToday}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500 uppercase">Absent</p><p className="text-2xl font-bold mt-1 text-rose-600">{absentToday < 0 ? 0 : absentToday}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500 uppercase">30-Day Rate</p><p className="text-2xl font-bold mt-1 text-indigo-600">{monthlyRate}%</p></Card>
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
                <Bar dataKey="Absent" stackId="a" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">By Method</h3>
          {methodBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No attendance records yet. Use the QR scanner or mark manually below.</p>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={methodBreakdown} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75} paddingAngle={4}>
                      {methodBreakdown.map((_, i) => <Cell key={i} fill={["#6366f1", "#a855f7", "#10b981"][i % 3]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "none", borderRadius: 12, color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1 text-xs">
                {methodBreakdown.map((m, i) => (
                  <div key={m.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: ["#6366f1", "#a855f7", "#10b981"][i % 3] }} /> {m.name}</span>
                    <span className="font-semibold">{m.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Manual Attendance & Member QR</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/40 dark:bg-white/5">
              <Avatar name={u.name} gradient={u.avatar} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{u.name.split("(")[0]}</p>
                <p className="text-xs text-slate-500">{u.memberId}</p>
              </div>
              <div className="flex gap-1">
                <button title="Show QR" onClick={() => showMemberQr(u)} className="h-8 w-8 rounded-lg bg-indigo-500/15 text-indigo-600 hover:bg-indigo-500/25 flex items-center justify-center"><QrCode className="h-4 w-4" /></button>
                <button title="Present" onClick={() => markAttendance(u.id, "Manual", "Present", eventId || undefined)} className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 flex items-center justify-center"><CheckCheck className="h-4 w-4" /></button>
                <button title="Late" onClick={() => markAttendance(u.id, "Manual", "Late", eventId || undefined)} className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 flex items-center justify-center"><Clock className="h-4 w-4" /></button>
                <button title="Absent" onClick={() => markAttendance(u.id, "Manual", "Absent", eventId || undefined)} className="h-8 w-8 rounded-lg bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 flex items-center justify-center"><XCircle className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="QR Attendance Scanner">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"><Calendar className="h-3 w-3 inline mr-1" />Event / Session</label>
            <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">— General attendance —</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </Select>
          </div>
          <div className="text-center py-4">
            <div className="relative mx-auto h-56 w-56 rounded-3xl soc-bg-soft ring-2 ring-indigo-500/30 flex items-center justify-center overflow-hidden">
              <ScanLine className="h-20 w-20 text-indigo-500" />
              <div className="absolute inset-x-4 top-1/2 h-1 bg-teal-500 shimmer" />
            </div>
            <p className="mt-6 text-sm text-slate-500">Point your camera at a member QR code to mark attendance.</p>
            <div className="mt-4 max-w-md mx-auto text-left">
              <Input value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="Paste QR payload, Member ID, Special Number, or username" />
            </div>
            <Button className="mt-4" onClick={handleQrScan}>Simulate Scan</Button>
            {scanned && (
              <div className={`mt-4 rounded-xl px-4 py-2 inline-block font-semibold ${
                scanned.duplicate ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              }`}>
                {scanned.duplicate ? "⚠ Duplicate prevented — " : "✓ Recorded — "}
                {scanned.name}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal open={!!memberQr} onClose={() => setMemberQr(null)} title="Member QR Code">
        {memberQr && (
          <div className="text-center py-6">
            <p className="font-semibold">{memberQr.user.name}</p>
            <p className="text-xs text-slate-500 mb-4 flex justify-center gap-2 mt-1">
              <Badge tone="indigo">{memberQr.user.memberId}</Badge>
              <Badge tone="violet">{memberQr.user.specialNumber}</Badge>
            </p>
            <img src={memberQr.img} alt="Member QR" className="mx-auto rounded-xl shadow-md" />
            <p className="text-xs text-slate-500 mt-4">Display this QR to admins for instant attendance.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
