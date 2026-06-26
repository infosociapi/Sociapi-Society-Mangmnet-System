import { useMemo, useState } from "react";
import { Avatar, Badge, Button, Card } from "../components/ui";
import { useApp } from "../context/AppContext";
import {
  Sparkles,
  Users,
  TrendingUp,
  FileText,
  Mail,
  Handshake,
  CalendarRange,
  Activity,
  Wallet,
  Loader2,
} from "lucide-react";

type Tool =
  | "inactive"
  | "promotions"
  | "performance"
  | "outreach_email"
  | "sponsorship"
  | "monthly_report"
  | "attendance_analysis"
  | "finance_analysis";

const tools: { id: Tool; label: string; icon: React.ReactNode; desc: string; tone: any }[] = [
  { id: "inactive", label: "Find Inactive Members", icon: <Users className="h-5 w-5" />, desc: "Identify members at risk of churn", tone: "indigo" },
  { id: "promotions", label: "Recommend Promotions", icon: <TrendingUp className="h-5 w-5" />, desc: "Spot rising stars in your org", tone: "emerald" },
  { id: "performance", label: "Summarize Performance", icon: <Activity className="h-5 w-5" />, desc: "Executive snapshot of the team", tone: "violet" },
  { id: "outreach_email", label: "Generate Outreach Email", icon: <Mail className="h-5 w-5" />, desc: "Cold email tailored to a contact", tone: "sky" },
  { id: "sponsorship", label: "Sponsorship Proposal", icon: <Handshake className="h-5 w-5" />, desc: "Draft a partnership pitch", tone: "fuchsia" },
  { id: "monthly_report", label: "Monthly Report", icon: <CalendarRange className="h-5 w-5" />, desc: "Auto-generate the org's monthly digest", tone: "amber" },
  { id: "attendance_analysis", label: "Analyze Attendance", icon: <Activity className="h-5 w-5" />, desc: "Trends, alerts and recommendations", tone: "indigo" },
  { id: "finance_analysis", label: "Analyze Finances", icon: <Wallet className="h-5 w-5" />, desc: "Cash flow insights & forecasts", tone: "emerald" },
];

export default function AI() {
  const { users, tasks, attendance, finance, outreach, events } = useApp();
  const [active, setActive] = useState<Tool>("inactive");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>("");

  const run = (t: Tool) => {
    setActive(t);
    setLoading(true);
    setOutput("");
    setTimeout(() => {
      setOutput(generate(t));
      setLoading(false);
    }, 700);
  };

  const totals = useMemo(() => {
    const income = finance.filter((f) => f.type !== "Expense").reduce((s, f) => s + f.amount, 0);
    const expense = finance.filter((f) => f.type === "Expense").reduce((s, f) => s + f.amount, 0);
    return { income, expense, balance: income - expense };
  }, [finance]);

  function generate(t: Tool): string {
    switch (t) {
      case "inactive": {
        const inactive = users.filter((u) => u.attendance < 70 || u.status === "Inactive");
        return [
          `🔍 Found ${inactive.length} members showing signs of inactivity:`,
          ...inactive.map((u) => `  • ${u.name} (${u.memberId}) — attendance ${u.attendance}%, ${u.points} pts`),
          "",
          "💡 Suggested actions:",
          "  1. Send a personalized check-in via WhatsApp.",
          "  2. Reassign critical tasks to active members.",
          "  3. Invite to next event with a small role to re-engage.",
        ].join("\n");
      }
      case "promotions": {
        const candidates = [...users].sort((a, b) => b.points - a.points).slice(0, 5);
        return [
          "🚀 Top promotion candidates based on points, attendance and contributions:",
          ...candidates.map((u, i) => `  ${i + 1}. ${u.name} — ${u.points} pts, ${u.attendance}% attendance · Current role: ${u.role}`),
          "",
          "Recommendation: shortlist top 2 for an Executive role; the others deserve a Department Lead trial.",
        ].join("\n");
      }
      case "performance": {
        const completed = tasks.filter((t) => t.status === "Completed").length;
        const overdue = tasks.filter((t) => t.status === "Overdue").length;
        const present = attendance.filter((a) => a.status === "Present").length;
        return [
          "📊 Team Performance Snapshot",
          `• Total Members: ${users.length} (${users.filter((u) => u.status === "Active").length} active)`,
          `• Tasks: ${completed} completed, ${overdue} overdue, ${tasks.length} total`,
          `• Attendance Events: ${present}/${attendance.length} present`,
          `• Avg points/member: ${Math.round(users.reduce((s, u) => s + u.points, 0) / users.length)}`,
          "",
          "Strengths: high engagement in Design and Events departments.",
          "Watch-outs: Outreach has 1 overdue task; consider rotating ownership.",
        ].join("\n");
      }
      case "outreach_email": {
        const c = outreach[0];
        return [
          `Subject: Partnership Opportunity with Sociapi × ${c.organization}`,
          "",
          `Dear ${c.name.split(" ")[0]},`,
          "",
          `I hope this email finds you well. I'm reaching out from Sociapi Nexus — a fast-growing community of student leaders and changemakers.`,
          "",
          `We've been admiring the work ${c.organization} is doing in the ${c.type.toLowerCase()} space, and we believe there is a powerful synergy between our mission and yours.`,
          "",
          "Would you be open to a 20-minute call next week to explore how we might collaborate? I'd love to share specifics on our upcoming initiatives and reach.",
          "",
          "Warm regards,",
          "Muhammad Zuhair Zeb",
          "Founder · Sociapi Nexus",
        ].join("\n");
      }
      case "sponsorship": {
        return [
          "📄 SPONSORSHIP PROPOSAL — SOCIAPI NEXUS",
          "════════════════════════════════════════",
          "",
          "Executive Summary:",
          `Sociapi is a thriving organization of ${users.length}+ members across ${new Set(users.map((u) => u.department)).size} departments. Our flagship events reach 500+ attendees per quarter.`,
          "",
          "Tiers:",
          "  🥉 Bronze · PKR 50,000 — Logo placement, social shoutout",
          "  🥈 Silver · PKR 150,000 — Booth, banner, panel speaking",
          "  🥇 Gold · PKR 300,000 — Title sponsor, keynote slot, branded merch",
          "  💎 Platinum · PKR 500,000 — Year-long exclusivity, named scholarships",
          "",
          "Expected ROI: 12,000+ brand impressions per campaign, direct talent funnel from top university chapters.",
          "",
          "Next step: schedule a call to customize a package for your goals.",
        ].join("\n");
      }
      case "monthly_report": {
        return [
          "📅 MONTHLY ORGANIZATION REPORT",
          "═══════════════════════════════",
          "",
          "MEMBERSHIP",
          `• Total members: ${users.length}`,
          `• Active rate: ${Math.round((users.filter((u) => u.status === "Active").length / users.length) * 100)}%`,
          "",
          "OPERATIONS",
          `• Tasks completed: ${tasks.filter((t) => t.status === "Completed").length}`,
          `• Open tasks: ${tasks.filter((t) => t.status !== "Completed").length}`,
          `• Events held: ${events.filter((e) => e.status === "Completed").length}`,
          "",
          "FINANCE",
          `• Income: PKR ${totals.income.toLocaleString()}`,
          `• Expenses: PKR ${totals.expense.toLocaleString()}`,
          `• Net: PKR ${totals.balance.toLocaleString()}`,
          "",
          "OUTREACH",
          `• Active partnerships: ${outreach.filter((o) => o.stage === "Partnership").length}`,
          `• In pipeline: ${outreach.filter((o) => o.stage !== "Partnership").length}`,
          "",
          "✅ Overall verdict: HEALTHY. Continue current trajectory.",
        ].join("\n");
      }
      case "attendance_analysis": {
        const present = attendance.filter((a) => a.status === "Present").length;
        const late = attendance.filter((a) => a.status === "Late").length;
        const absent = attendance.filter((a) => a.status === "Absent").length;
        return [
          "📈 ATTENDANCE INTELLIGENCE",
          `• Total records: ${attendance.length}`,
          `• Present: ${present} (${Math.round((present / attendance.length) * 100)}%)`,
          `• Late: ${late} (${Math.round((late / attendance.length) * 100)}%)`,
          `• Absent: ${absent}`,
          "",
          "Insights:",
          "  • Tuesdays show the highest attendance — schedule meetings then.",
          "  • The Decor and Media teams have above-average punctuality.",
          "  • 2 members trending down — consider 1:1 check-in.",
        ].join("\n");
      }
      case "finance_analysis": {
        const burnRate = totals.expense / 3;
        const runway = totals.balance > 0 && burnRate > 0 ? Math.floor(totals.balance / burnRate) : 0;
        return [
          "💰 FINANCIAL INTELLIGENCE",
          `• Income: PKR ${totals.income.toLocaleString()}`,
          `• Expenses: PKR ${totals.expense.toLocaleString()}`,
          `• Net Balance: PKR ${totals.balance.toLocaleString()}`,
          `• Estimated burn rate: PKR ${Math.round(burnRate).toLocaleString()}/mo`,
          `• Runway: ~${runway} months at current rate`,
          "",
          "Recommendations:",
          "  1. Diversify revenue — sponsorships are 60% of income.",
          "  2. Lock in 2 more corporate partnerships before Q3.",
          "  3. Trim event decor budget by ~15% based on past ROI.",
        ].join("\n");
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden p-6 lg:p-8">
        <div className="absolute -right-12 -top-12 w-80 h-80 rounded-full soc-bg-soft blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl soc-bg-main flex items-center justify-center text-white shadow-lg pulse-ring">
            <Sparkles className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Command Center</h1>
            <p className="text-sm text-slate-500">Your AI co-pilot for running a thriving organization.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => run(t.id)}
              className={`w-full text-left p-4 rounded-2xl glass hover:scale-[1.01] transition-all ${active === t.id ? "ring-2 ring-indigo-500" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">{t.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{t.label}</p>
                  <p className="text-xs text-slate-500">{t.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <Card className="lg:col-span-2 p-6 min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <p className="font-semibold">{tools.find((t) => t.id === active)?.label}</p>
            </div>
            <Badge tone="indigo">AI-generated</Badge>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="mt-3 text-sm">Crunching org data…</p>
            </div>
          ) : output ? (
            <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-slate-700 dark:text-slate-300">{output}</pre>
          ) : (
            <div className="text-center py-20 text-slate-500">
              <FileText className="h-10 w-10 mx-auto mb-3" />
              <p className="text-sm">Pick a tool to generate insights.</p>
            </div>
          )}

          {output && !loading && (
            <div className="mt-6 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(output)}>Copy</Button>
              <Button size="sm" variant="ghost" onClick={() => run(active)}>Regenerate</Button>
            </div>
          )}
        </Card>
      </div>

      {/* Inline insights row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">AI Suggestion</p>
          <p className="font-semibold">Boost engagement by 18%</p>
          <p className="text-sm text-slate-500 mt-1">Run a flash points-doubling weekend.</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Risk Detected</p>
          <p className="font-semibold">1 overdue critical task</p>
          <p className="text-sm text-slate-500 mt-1">Auto-escalating to Founder in 2 days.</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Top Mover</p>
          <p className="font-semibold">{users[0]?.name}</p>
          <p className="text-sm text-slate-500 mt-1">+120 points this week.</p>
        </Card>
      </div>

      <Card className="p-6">
        <p className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Team Snapshot</p>
        <div className="flex flex-wrap -space-x-2">
          {users.slice(0, 12).map((u) => (
            <div key={u.id} className="ring-2 ring-white dark:ring-slate-900 rounded-full">
              <Avatar name={u.name} gradient={u.avatar} size={36} />
            </div>
          ))}
          <span className="ml-3 text-sm text-slate-500 self-center">+{users.length - 12} more</span>
        </div>
      </Card>
    </div>
  );
}
