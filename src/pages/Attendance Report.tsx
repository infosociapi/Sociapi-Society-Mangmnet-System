import { useState, useMemo } from "react";
import { Button, Card, Select } from "../components/ui";
import { useApp } from "../context/AppContext";
import { FileDown } from "lucide-react";
import { format } from "date-fns";

export default function AttendanceReport() {
  const { users, attendance } = useApp();
  const [year] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  const reportData = useMemo(() => {
    return users.map((u) => {
      const records = attendance.filter((a) => a.userId === u.id);
      const filtered = records.filter((a) => {
        const d = new Date(a.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      const total = filtered.length;
      const present = filtered.filter((a) => a.status === "Present").length;
      const absent = filtered.filter((a) => a.status === "Absent").length;
      const late = filtered.filter((a) => a.status === "Late").length;
      const excused = filtered.filter((a) => a.status === "Excused").length;
      return { ...u, total, present, absent, late, excused, pct: total ? Math.round((present / total) * 100) : 0 };
    });
  }, [users, attendance, year, month]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Attendance Report</h1>
        <div className="flex gap-2">
            <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-32">
                {Array.from({length: 12}).map((_, i) => <option key={i} value={i}>{format(new Date(2026, i), "MMMM")}</option>)}
            </Select>
            <Button icon={<FileDown className="h-4 w-4" />}>Export CSV</Button>
        </div>
      </div>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-white/5 text-xs uppercase">
            <tr>
              <th className="p-3 text-left">Member</th>
              <th className="p-3 text-center">Total</th>
              <th className="p-3 text-center text-emerald-600">Present</th>
              <th className="p-3 text-center text-rose-600">Absent</th>
              <th className="p-3 text-center text-amber-600">Late</th>
              <th className="p-3 text-center text-slate-500">Excused</th>
              <th className="p-3 text-right">Attendance %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {reportData.map(r => (
              <tr key={r.id}>
                <td className="p-3 font-semibold">{r.name}</td>
                <td className="p-3 text-center">{r.total}</td>
                <td className="p-3 text-center">{r.present}</td>
                <td className="p-3 text-center">{r.absent}</td>
                <td className="p-3 text-center">{r.late}</td>
                <td className="p-3 text-center">{r.excused}</td>
                <td className="p-3 text-right font-bold">{r.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
