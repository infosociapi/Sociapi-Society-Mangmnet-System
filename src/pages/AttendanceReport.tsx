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
      const absent  = filtered.filter((a) => a.status === "Absent").length;
      const late    = filtered.filter((a) => a.status === "Late").length;
      const excused = filtered.filter((a) => a.status === "Excused").length;
      return {
        ...u, total, present, absent, late, excused,
        pct: total ? Math.round((present / total) * 100) : 0,
      };
    });
  }, [users, attendance, year, month]);

  const exportCSV = () => {
    const monthName = format(new Date(year, month), "MMMM_yyyy");
    const headers = [
      "Name","Department","Role","Total",
      "Present","Absent","Late","Excused","Attendance %",
    ];
    const rows = reportData.map((r) => [
      r.name, r.department, r.role,
      r.total, r.present, r.absent, r.late, r.excused,
      `${r.pct}%`,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = `attendance_report_${monthName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Attendance Report</h1>
          <p className="text-sm text-slate-500">
            {format(new Date(year, month), "MMMM yyyy")} ·{" "}
            {reportData.filter((r) => r.total > 0).length} members with records
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-36"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>
                {format(new Date(2026, i), "MMMM")}
              </option>
            ))}
          </Select>
          <Button icon={<FileDown className="h-4 w-4" />} onClick={exportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-white/5 text-xs uppercase">
            <tr>
              <th className="p-3 text-left">Member</th>
              <th className="p-3 text-left">Department</th>
              <th className="p-3 text-center">Total</th>
              <th className="p-3 text-center text-emerald-600">Present</th>
              <th className="p-3 text-center text-rose-600">Absent</th>
              <th className="p-3 text-center text-amber-600">Late</th>
              <th className="p-3 text-center text-slate-500">Excused</th>
              <th className="p-3 text-right">Attendance %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {reportData.map((r) => (
              <tr
                key={r.id}
                className={
                  r.total === 0
                    ? "opacity-40"
                    : "hover:bg-slate-50 dark:hover:bg-white/5"
                }
              >
                <td className="p-3 font-semibold">{r.name}</td>
                <td className="p-3 text-slate-500 text-xs">{r.department}</td>
                <td className="p-3 text-center">{r.total}</td>
                <td className="p-3 text-center text-emerald-600 font-semibold">
                  {r.present}
                </td>
                <td className="p-3 text-center text-rose-600 font-semibold">
                  {r.absent}
                </td>
                <td className="p-3 text-center text-amber-600 font-semibold">
                  {r.late}
                </td>
                <td className="p-3 text-center text-slate-500">{r.excused}</td>
                <td className="p-3 text-right font-bold">
                  {r.total > 0 ? (
                    <span
                      className={
                        r.pct >= 75
                          ? "text-emerald-600"
                          : r.pct >= 50
                          ? "text-amber-600"
                          : "text-rose-600"
                      }
                    >
                      {r.pct}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}