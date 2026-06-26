import { useMemo, useState } from "react";
import { Badge, Button, Card, Input, Label, Modal, Select } from "../components/ui";
import { useApp } from "../context/AppContext";
import type { FinanceEntry } from "../types";
import { ArrowDownRight, ArrowUpRight, Plus, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";



export default function Finance() {
  const { finance, addFinance, updateFinance, deleteFinance, events, hasPermission } = useApp();
  const canManage = hasPermission("manage_finance");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<FinanceEntry>>({
    type: "Donation",
    amount: 0,
    description: "",
    date: new Date().toISOString().slice(0, 10),
    category: "Donations",
    eventId: "",
  });

  const totals = useMemo(() => {
    const income = finance.filter((f) => f.type !== "Expense").reduce((s, f) => s + f.amount, 0);
    const expense = finance.filter((f) => f.type === "Expense").reduce((s, f) => s + f.amount, 0);
    const donations = finance.filter((f) => f.type === "Donation").reduce((s, f) => s + f.amount, 0);
    const sponsorships = finance.filter((f) => f.type === "Sponsorship").reduce((s, f) => s + f.amount, 0);
    const fees = finance.filter((f) => f.type === "Membership Fee").reduce((s, f) => s + f.amount, 0);
    return { income, expense, balance: income - expense, donations, sponsorships, fees };
  }, [finance]);

  const trend = useMemo(() => {
    const buckets: Record<string, { date: string; income: number; expense: number }> = {};
    [...finance]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((f) => {
        const key = new Date(f.date).toLocaleDateString("en", { month: "short", day: "numeric" });
        if (!buckets[key]) buckets[key] = { date: key, income: 0, expense: 0 };
        if (f.type === "Expense") buckets[key].expense += f.amount;
        else buckets[key].income += f.amount;
      });
    return Object.values(buckets);
  }, [finance]);

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    finance.forEach((f) => (map[f.type] = (map[f.type] || 0) + f.amount));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [finance]);

  const pieColors = ["#6366f1", "#a855f7", "#10b981", "#f43f5e", "#f59e0b"];

  const save = () => {
    if (!form.amount || !form.description) return;
    const payload = {
      type: form.type as FinanceEntry["type"],
      amount: +form.amount,
      description: form.description!,
      date: new Date(form.date as string).toISOString(),
      category: form.category || "General",
      eventId: form.eventId || undefined,
    };
    if (editingId) updateFinance(editingId, payload);
    else addFinance(payload);
    setOpen(false);
    setEditingId(null);
    setForm({ ...form, amount: 0, description: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
          <p className="text-sm text-slate-500">Donations · Sponsorships · Membership · Budget</p>
        </div>
        {canManage && <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditingId(null); setForm({ type: "Donation", amount: 0, description: "", date: new Date().toISOString().slice(0, 10), category: "Donations", eventId: "" }); setOpen(true); }}>Add Entry</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 soc-bg-teal text-white">
          <p className="text-xs uppercase tracking-wider opacity-90">Total Amount Collected</p>
          <p className="text-3xl font-bold mt-1">PKR {totals.income.toLocaleString()}</p>
          <p className="text-xs opacity-90 mt-1">Donations + Sponsorships + Fees + Other Income</p>
        </Card>
        <Card className="p-5 soc-bg-rose text-white">
          <p className="text-xs uppercase tracking-wider opacity-90">Total Expense</p>
          <p className="text-3xl font-bold mt-1">PKR {totals.expense.toLocaleString()}</p>
          <p className="text-xs opacity-90 mt-1">All recorded expenses</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiF icon={<Wallet className="h-5 w-5" />} label="Balance" value={totals.balance} tone="indigo" />
        <KpiF icon={<TrendingUp className="h-5 w-5" />} label="Income" value={totals.income} tone="emerald" />
        <KpiF icon={<TrendingDown className="h-5 w-5" />} label="Expenses" value={totals.expense} tone="rose" />
        <KpiF icon={<ArrowUpRight className="h-5 w-5" />} label="Donations" value={totals.donations} tone="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-semibold mb-4">Cash Flow</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={0.5} /><stop offset="100%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "none", borderRadius: 12, color: "#fff" }} />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#inc)" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fill="url(#exp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">By Category</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} paddingAngle={4}>
                  {byType.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "none", borderRadius: 12, color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1 text-xs">
            {byType.map((b, i) => (
              <div key={b.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: pieColors[i % pieColors.length] }} /> {b.name}</span>
                <span className="font-semibold">PKR {b.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200/60 dark:border-white/10">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Event</th>
                <th className="py-3 px-3 text-right">Amount</th>
                {canManage && <th className="py-3 px-3"></th>}
              </tr>
            </thead>
            <tbody>
              {finance.map((f) => (
                <tr key={f.id} className="border-b border-slate-200/60 dark:border-white/5 hover:bg-slate-100/40 dark:hover:bg-white/5">
                  <td className="py-3 px-3 text-slate-500">{new Date(f.date).toLocaleDateString()}</td>
                  <td className="py-3 px-3">
                    <Badge tone={f.type === "Expense" ? "rose" : f.type === "Donation" ? "violet" : f.type === "Sponsorship" ? "indigo" : "emerald"}>{f.type}</Badge>
                  </td>
                  <td className="py-3 px-3">{f.description}</td>
                  <td className="py-3 px-3 text-slate-500">{f.category}</td>
                  <td className="py-3 px-3 text-slate-500">{events.find((e) => e.id === f.eventId)?.title || "—"}</td>
                  <td className="py-3 px-3 text-right font-semibold">
                    <span className={f.type === "Expense" ? "text-rose-600" : "text-emerald-600"}>
                      {f.type === "Expense" ? <ArrowDownRight className="inline h-3 w-3" /> : <ArrowUpRight className="inline h-3 w-3" />} PKR {f.amount.toLocaleString()}
                    </span>
                  </td>
                  {canManage && (
                    <td className="py-3 px-3 text-right">
                      <button className="text-xs text-blue-600 hover:underline mr-3" onClick={() => { setEditingId(f.id); setForm({ ...f, date: f.date.slice(0, 10) }); setOpen(true); }}>Edit</button>
                      <button className="text-xs text-rose-600 hover:underline" onClick={() => deleteFinance(f.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? "Edit Finance Entry" : "Add Finance Entry"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type as string} onChange={(e) => setForm({ ...form, type: e.target.value as FinanceEntry["type"] })}>
                <optgroup label="Money IN (Collected)">
                  <option>Donation</option>
                  <option>Sponsorship</option>
                  <option>Membership Fee</option>
                  <option>Other Income</option>
                </optgroup>
                <optgroup label="Money OUT (Spent)">
                  <option>Expense</option>
                </optgroup>
              </Select>
            </div>
            <div>
              <Label>Amount (PKR)</Label>
              <Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: +e.target.value })} />
            </div>
          </div>

          {/* Clear indicator: income or expense */}
          {form.type === "Expense" ? (
            <div className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm ring-1 ring-rose-500/20">
              💸 This is an <strong>EXPENSE</strong> — PKR {(form.amount || 0).toLocaleString()} will be counted as money <strong>spent</strong>.
            </div>
          ) : (
            <div className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm ring-1 ring-emerald-500/20">
              💰 This is <strong>INCOME</strong> — PKR {(form.amount || 0).toLocaleString()} will be counted as money <strong>collected</strong>.
            </div>
          )}
          <div><Label>Description</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input type="date" value={form.date as string} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label>Category</Label><Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          </div>
          <div>
            <Label>Linked Event</Label>
            <Select value={form.eventId || ""} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>
              <option value="">No linked event</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editingId ? "Save" : "Add"}</Button></div>
      </Modal>
    </div>
  );
}

function KpiF({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "indigo" | "emerald" | "rose" | "violet" }) {
  const tones: Record<string, string> = {
    indigo: "soc-bg-teal",
    emerald: "soc-bg-teal",
    rose: "soc-bg-rose",
    violet: "soc-bg-main",
  };
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className={`h-10 w-10 rounded-xl ${tones[tone]} text-white flex items-center justify-center shadow-md`}>{icon}</div>
      </div>
      <p className="mt-3 text-xl font-bold tracking-tight">PKR {value.toLocaleString()}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </Card>
  );
}
