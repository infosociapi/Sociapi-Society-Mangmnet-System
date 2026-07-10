import { useMemo, useState } from "react";
import { Badge, Button, Card, Input, Label, Modal, Select } from "../components/ui";
import { useApp } from "../context/AppContext";
import type { FinanceEntry } from "../types";
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  Calculator,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Simple, separate lists so income and expense never mix up.
const INCOME_CATEGORIES = ["Donations", "Sponsorship", "Membership Fee", "Ticket Sales", "Other Income"];
const EXPENSE_CATEGORIES = [
  "Event Cost",
  "Decoration",
  "Food & Refreshments",
  "Printing & Stationery",
  "Transport",
  "Venue",
  "Marketing",
  "Miscellaneous",
];

type Mode = "income" | "expense";

const emptyForm = (mode: Mode): Partial<FinanceEntry> => ({
  type: mode === "income" ? "Donation" : "Expense",
  amount: 0,
  description: "",
  date: new Date().toISOString().slice(0, 10),
  category: mode === "income" ? "Donations" : "Event Cost",
  eventId: "",
});

export default function Finance() {
  const { finance, addFinance, updateFinance, deleteFinance, events, hasPermission } = useApp();
  const canManage = hasPermission("manage_finance");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("income");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<FinanceEntry>>(emptyForm("income"));
  const [customCategory, setCustomCategory] = useState(false);

  const [txFilter, setTxFilter] = useState<"All" | "Income" | "Expense">("All");

  // ---- Quick Calculator state ----
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcRows, setCalcRows] = useState<{ id: number; label: string; amount: number }[]>([
    { id: 1, label: "", amount: 0 },
  ]);
  const calcTotal = calcRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const addCalcRow = () => setCalcRows((r) => [...r, { id: Date.now(), label: "", amount: 0 }]);
  const removeCalcRow = (id: number) => setCalcRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r));
  const updateCalcRow = (id: number, key: "label" | "amount", value: string | number) =>
    setCalcRows((r) => r.map((x) => (x.id === id ? { ...x, [key]: value } : x)));

  const totals = useMemo(() => {
    const income = finance.filter((f) => f.type !== "Expense").reduce((s, f) => s + f.amount, 0);
    const expense = finance.filter((f) => f.type === "Expense").reduce((s, f) => s + f.amount, 0);
    const donations = finance.filter((f) => f.type === "Donation").reduce((s, f) => s + f.amount, 0);
    const sponsorships = finance.filter((f) => f.type === "Sponsorship").reduce((s, f) => s + f.amount, 0);
    const now = new Date();
    const thisMonth = finance.filter((f) => {
      const d = new Date(f.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthIn = thisMonth.filter((f) => f.type !== "Expense").reduce((s, f) => s + f.amount, 0);
    const monthOut = thisMonth.filter((f) => f.type === "Expense").reduce((s, f) => s + f.amount, 0);
    return { income, expense, balance: income - expense, donations, sponsorships, monthIn, monthOut };
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

  // ---- Event Profit & Loss ----
  // Combines money entered directly on an event (Events page) with any Finance
  // entries linked to that event, so nothing gets missed or double-guessed.
  const eventFinance = useMemo(() => {
    return events
      .map((e) => {
        const linked = finance.filter((f) => f.eventId === e.id);
        const linkedIncome = linked.filter((f) => f.type !== "Expense").reduce((s, f) => s + f.amount, 0);
        const linkedExpense = linked.filter((f) => f.type === "Expense").reduce((s, f) => s + f.amount, 0);
        const collected = (e.income || 0) + linkedIncome;
        const spent = (e.expense || 0) + linkedExpense;
        return { id: e.id, title: e.title, collected, spent, net: collected - spent };
      })
      .filter((x) => x.collected > 0 || x.spent > 0)
      .sort((a, b) => a.net - b.net);
  }, [events, finance]);

  const pieColors = ["#6366f1", "#a855f7", "#10b981", "#f43f5e", "#f59e0b"];

  const filteredTx = useMemo(() => {
    if (txFilter === "All") return finance;
    return finance.filter((f) => (txFilter === "Income" ? f.type !== "Expense" : f.type === "Expense"));
  }, [finance, txFilter]);

  const openCollect = (prefillAmount?: number) => {
    setEditingId(null);
    setMode("income");
    setCustomCategory(false);
    setForm({ ...emptyForm("income"), amount: prefillAmount || 0 });
    setOpen(true);
  };
  const openExpense = (prefillAmount?: number) => {
    setEditingId(null);
    setMode("expense");
    setCustomCategory(false);
    setForm({ ...emptyForm("expense"), amount: prefillAmount || 0 });
    setOpen(true);
  };
  const openEditEntry = (f: FinanceEntry) => {
    setEditingId(f.id);
    setMode(f.type === "Expense" ? "expense" : "income");
    const list = f.type === "Expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    setCustomCategory(!list.includes(f.category));
    setForm({ ...f, date: f.date.slice(0, 10) });
    setOpen(true);
  };

  const useCalcTotal = (target: Mode) => {
    setCalcOpen(false);
    setCalcRows([{ id: 1, label: "", amount: 0 }]);
    if (target === "income") openCollect(calcTotal);
    else openExpense(calcTotal);
  };

  const save = () => {
    if (!form.amount || !form.description) return;
    const payload = {
      type: mode === "income" ? (form.type as FinanceEntry["type"]) : ("Expense" as const),
      amount: +form.amount,
      description: form.description!,
      date: new Date(form.date as string).toISOString(),
      category: form.category || "General",
      eventId: form.eventId || undefined,
      reference: form.reference || undefined,
    };
    if (editingId) updateFinance(editingId, payload);
    else addFinance(payload);
    setOpen(false);
    setEditingId(null);
  };

  const categoryList = mode === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
          <p className="text-sm text-slate-500">One simple place to track money in, money out, and every event's result.</p>
        </div>
      </div>

      {/* Balance hero — the one number everyone actually wants to see */}
      <Card className={`p-6 text-white ${totals.balance >= 0 ? "soc-bg-teal" : "soc-bg-rose"}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-90">Current Balance</p>
            <p className="text-4xl font-bold mt-1">PKR {Math.abs(totals.balance).toLocaleString()}</p>
            <p className="text-sm opacity-90 mt-2">
              {totals.balance >= 0
                ? "Good news — you have more money collected than spent."
                : "Careful — you have spent more than what came in."}
            </p>
          </div>
          <div className="h-16 w-16 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            {totals.balance >= 0 ? <PiggyBank className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
          </div>
        </div>
        <div className="mt-4 flex gap-6 text-sm">
          <span>Collected: PKR {totals.income.toLocaleString()}</span>
          <span>Spent: PKR {totals.expense.toLocaleString()}</span>
        </div>
      </Card>

      {/* Two clear actions instead of one confusing form */}
      {canManage && (
        <div className="flex flex-wrap gap-3">
          <Button icon={<ArrowUpRight className="h-4 w-4" />} onClick={() => openCollect()}>
            Collect Money
          </Button>
          <Button variant="outline" icon={<ArrowDownRight className="h-4 w-4" />} onClick={() => openExpense()}>
            Add Expense
          </Button>
          <Button variant="ghost" icon={<Calculator className="h-4 w-4" />} onClick={() => setCalcOpen(true)}>
            Quick Calculator
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiF icon={<TrendingUp className="h-5 w-5" />} label="Collected This Month" value={totals.monthIn} tone="emerald" />
        <KpiF icon={<TrendingDown className="h-5 w-5" />} label="Spent This Month" value={totals.monthOut} tone="rose" />
        <KpiF icon={<Wallet className="h-5 w-5" />} label="Donations Total" value={totals.donations} tone="violet" />
        <KpiF icon={<ArrowUpRight className="h-5 w-5" />} label="Sponsorship Total" value={totals.sponsorships} tone="indigo" />
      </div>

      {/* Event Profit & Loss — the exact thing that was missing */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="font-semibold">Event Profit & Loss</h3>
          <p className="text-xs text-slate-500">See which events made money and which ones cost more than they earned.</p>
        </div>
        {eventFinance.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No event money recorded yet.</p>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={eventFinance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="title" stroke="#94a3b8" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,23,42,0.95)", border: "none", borderRadius: 12, color: "#fff" }}
                    formatter={(v: number) => [`PKR ${v.toLocaleString()}`, "Result"]}
                  />
                  <Bar dataKey="net" radius={[6, 6, 6, 6]}>
                    {eventFinance.map((ev, i) => (
                      <Cell key={i} fill={ev.net >= 0 ? "#10b981" : "#f43f5e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {eventFinance.map((ev) => (
                <div
                  key={ev.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl ${
                    ev.net >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{ev.title}</p>
                    <p className="text-xs text-slate-500">
                      Collected PKR {ev.collected.toLocaleString()} · Spent PKR {ev.spent.toLocaleString()}
                    </p>
                  </div>
                  <Badge tone={ev.net >= 0 ? "emerald" : "rose"}>
                    {ev.net >= 0 ? `Profit of PKR ${ev.net.toLocaleString()}` : `Loss of PKR ${Math.abs(ev.net).toLocaleString()}`}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-semibold mb-4">Cash Flow</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
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
                  {byType.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "none", borderRadius: 12, color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1 text-xs">
            {byType.map((b, i) => (
              <div key={b.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: pieColors[i % pieColors.length] }} /> {b.name}
                </span>
                <span className="font-semibold">PKR {b.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-semibold">Transactions</h3>
          <div className="flex gap-2">
            {(["All", "Income", "Expense"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTxFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  txFilter === t ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200/60 dark:border-white/10">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Bill / Ref</th>
                <th className="py-3 px-3">Event</th>
                <th className="py-3 px-3 text-right">Amount</th>
                {canManage && <th className="py-3 px-3"></th>}
              </tr>
            </thead>
            <tbody>
              {filteredTx.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="py-8 text-center text-slate-500">
                    No transactions here yet.
                  </td>
                </tr>
              )}
              {filteredTx.map((f) => (
                <tr key={f.id} className="border-b border-slate-200/60 dark:border-white/5 hover:bg-slate-100/40 dark:hover:bg-white/5">
                  <td className="py-3 px-3 text-slate-500">{new Date(f.date).toLocaleDateString()}</td>
                  <td className="py-3 px-3">
                    <Badge tone={f.type === "Expense" ? "rose" : f.type === "Donation" ? "violet" : f.type === "Sponsorship" ? "indigo" : "emerald"}>
                      {f.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-3">{f.description}</td>
                  <td className="py-3 px-3 text-slate-500">{f.category}</td>
                  <td className="py-3 px-3 text-slate-500">{f.reference || "—"}</td>
                  <td className="py-3 px-3 text-slate-500">{events.find((e) => e.id === f.eventId)?.title || "—"}</td>
                  <td className="py-3 px-3 text-right font-semibold">
                    <span className={f.type === "Expense" ? "text-rose-600" : "text-emerald-600"}>
                      {f.type === "Expense" ? <ArrowDownRight className="inline h-3 w-3" /> : <ArrowUpRight className="inline h-3 w-3" />} PKR{" "}
                      {f.amount.toLocaleString()}
                    </span>
                  </td>
                  {canManage && (
                    <td className="py-3 px-3 text-right">
                      <button className="text-xs text-blue-600 hover:underline mr-3" onClick={() => openEditEntry(f)}>
                        Edit
                      </button>
                      <button className="text-xs text-rose-600 hover:underline" onClick={() => deleteFinance(f.id)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit modal — locked to one mode at a time so it never gets confusing */}
      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? "Edit Entry" : mode === "income" ? "Collect Money" : "Add Expense"}>
        <div className="space-y-4">
          <div
            className={`px-3 py-2 rounded-xl text-sm ring-1 ${
              mode === "expense"
                ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-500/20"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20"
            }`}
          >
            {mode === "expense" ? (
              <>💸 This will be counted as money <strong>spent</strong>.</>
            ) : (
              <>💰 This will be counted as money <strong>collected</strong>.</>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount (PKR)</Label>
              <Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: +e.target.value })} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date as string} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>

          {mode === "income" && (
            <div>
              <Label>Source</Label>
              <Select value={form.type as string} onChange={(e) => setForm({ ...form, type: e.target.value as FinanceEntry["type"] })}>
                <option>Donation</option>
                <option>Sponsorship</option>
                <option>Membership Fee</option>
                <option>Other Income</option>
              </Select>
            </div>
          )}

          <div>
            <Label>Category</Label>
            <Select
              value={customCategory ? "Other" : form.category || ""}
              onChange={(e) => {
                if (e.target.value === "Other") {
                  setCustomCategory(true);
                  setForm({ ...form, category: "" });
                } else {
                  setCustomCategory(false);
                  setForm({ ...form, category: e.target.value });
                }
              }}
            >
              {categoryList.map((c) => (
                <option key={c}>{c}</option>
              ))}
              <option value="Other">Other (type your own)</option>
            </Select>
            {customCategory && (
              <Input
                className="mt-2"
                placeholder="Type category name"
                value={form.category || ""}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            )}
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={mode === "expense" ? "e.g. Bought decoration items" : "e.g. Sponsorship from XYZ"}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Bill / Receipt No (optional)</Label>
              <Input value={form.reference || ""} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. INV-1023" />
            </div>
            <div>
              <Label>Linked Event (optional)</Label>
              <Select value={form.eventId || ""} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>
                <option value="">No linked event</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} icon={<Plus className="h-4 w-4" />}>
            {editingId ? "Save" : mode === "income" ? "Collect" : "Add Expense"}
          </Button>
        </div>
      </Modal>

      {/* Quick Calculator — add up items first, then send the total straight into a new entry */}
      <Modal open={calcOpen} onClose={() => setCalcOpen(false)} title="Quick Calculator" size="lg">
        <p className="text-sm text-slate-500 mb-3">
          Add up a few bills or a few sources of money before you save them. Nothing here is saved until you use the total.
        </p>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {calcRows.map((r, idx) => (
            <div key={r.id} className="flex gap-2 items-center">
              <Input
                placeholder={`Item ${idx + 1} (optional)`}
                value={r.label}
                onChange={(e) => updateCalcRow(r.id, "label", e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="0"
                value={r.amount || ""}
                onChange={(e) => updateCalcRow(r.id, "amount", +e.target.value)}
                className="w-32"
              />
              <button onClick={() => removeCalcRow(r.id)} className="text-rose-500 text-sm px-2">
                ×
              </button>
            </div>
          ))}
        </div>
        <Button size="sm" variant="ghost" className="mt-2" onClick={addCalcRow}>
          + Add another line
        </Button>
        <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-between">
          <span className="font-semibold">Total</span>
          <span className="text-xl font-bold">PKR {calcTotal.toLocaleString()}</span>
        </div>
        <div className="flex flex-wrap justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => useCalcTotal("income")}>
            Use as Money Collected
          </Button>
          <Button onClick={() => useCalcTotal("expense")}>Use as Expense</Button>
        </div>
      </Modal>
    </div>
  );
}

function KpiF({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "indigo" | "emerald" | "rose" | "violet";
}) {
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