import { useMemo } from "react";
import { Avatar, Badge, Card } from "../components/ui";
import { useApp } from "../context/AppContext";
import { Crown, Medal, Trophy, TrendingUp, Sparkles } from "lucide-react";

export default function Leaderboard() {
  const { users } = useApp();

  const ranking = useMemo(() => {
    return [...users].sort((a, b) => b.points - a.points);
  }, [users]);

  const promotions = useMemo(() => {
    return ranking.slice(0, 5).filter((u) => u.points > 600 && u.role === "General Member");
  }, [ranking]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard & Performance</h1>
        <p className="text-sm text-slate-500">Member ranking · Promotion suggestions · Points system</p>
      </div>

      {/* Points System */}
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Points System</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { l: "Attendance", v: "+5", t: "emerald" },
            { l: "Task Completed", v: "+10", t: "indigo" },
            { l: "Event Participation", v: "+15", t: "violet" },
            { l: "Referral", v: "+20", t: "fuchsia" },
            { l: "Late Submission", v: "-5", t: "amber" },
            { l: "Missed Task", v: "-10", t: "rose" },
          ].map((p) => (
            <div key={p.l} className="rounded-xl bg-slate-100/60 dark:bg-white/5 p-3 text-center">
              <p className={`text-lg font-bold text-${p.t}-600 dark:text-${p.t}-400`}>{p.v}</p>
              <p className="text-xs text-slate-500 mt-1">{p.l}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Top 3 podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ranking.slice(0, 3).map((u, i) => {
          const icons = [<Crown className="h-6 w-6 text-amber-400" />, <Trophy className="h-6 w-6 text-slate-400" />, <Medal className="h-6 w-6 text-orange-400" />];
          const tones = ["soc-bg-soft ring-amber-500/30", "bg-slate-100/80 dark:bg-white/5 ring-slate-400/30", "soc-bg-soft ring-orange-500/30"];
          return (
            <Card key={u.id} className={`p-6 text-center ${tones[i]} ring-1`}>
              <div className="flex justify-center mb-2">{icons[i]}</div>
              <Avatar name={u.name} gradient={u.avatar} size={72} />
              <p className="mt-3 font-bold">{u.name}</p>
              <p className="text-xs text-slate-500">{u.position}</p>
              <p className="mt-3 text-3xl font-bold text-teal-600 dark:text-teal-300">{u.points}</p>
              <p className="text-xs uppercase tracking-wider text-slate-500">points</p>
            </Card>
          );
        })}
      </div>

      {/* Full ranking */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Full Ranking</h3>
        <div className="space-y-2">
          {ranking.map((u, i) => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100/40 dark:hover:bg-white/5">
              <span className={`h-8 w-8 rounded-lg font-bold text-sm flex items-center justify-center ${i < 3 ? "soc-bg-amber text-white" : "bg-slate-100 dark:bg-white/5"}`}>{i + 1}</span>
              <Avatar name={u.name} gradient={u.avatar} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{u.name}</p>
                <p className="text-xs text-slate-500 truncate">{u.position} · {u.department}</p>
              </div>
              <Badge tone="indigo">{u.attendance}%</Badge>
              <div className="text-right w-24">
                <p className="font-bold">{u.points}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">points</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Promotion suggestions */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold">AI Promotion Suggestions</h3>
        </div>
        {promotions.length === 0 ? (
          <p className="text-sm text-slate-500">No promotion candidates right now. Members with 600+ points are flagged.</p>
        ) : (
          <div className="space-y-3">
            {promotions.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 p-3 rounded-xl soc-bg-soft-r ring-1 ring-emerald-500/20">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} gradient={u.avatar} />
                  <div>
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-xs text-slate-500">Currently: {u.role} → Suggested: Executive</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <Badge tone="emerald">{u.points} pts</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
