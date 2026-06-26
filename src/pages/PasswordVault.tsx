import { useState } from "react";
import { Avatar, Badge, Button, Card, Input } from "../components/ui";
import { useApp } from "../context/AppContext";
import { Eye, EyeOff, KeyRound, Search, ShieldAlert } from "lucide-react";

function newPassword() {
  return `Sociapi@2026#${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export default function PasswordVault() {
  const { users, isSuperAdmin, resetUserPassword } = useApp();
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(false);
  const [generated, setGenerated] = useState<{ username: string; password: string } | null>(null);

  if (!isSuperAdmin()) {
    return (
      <Card className="p-10 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-amber-500 mb-3" />
        <p className="font-semibold">Super Admin Only</p>
        <p className="text-sm text-slate-500">Only Super Admin can access member passwords.</p>
      </Card>
    );
  }

  const rows = users.filter((u) => {
    const s = q.toLowerCase();
    return !s || u.name.toLowerCase().includes(s) || u.username.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  const reset = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const password = newPassword();
    resetUserPassword(id, password);
    setGenerated({ username: user.username, password });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Password Vault</h1>
          <p className="text-sm text-slate-500">Separate Super Admin-only view for all member credentials.</p>
        </div>
        <Button variant="outline" icon={visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} onClick={() => setVisible((v) => !v)}>
          {visible ? "Hide Passwords" : "Show Passwords"}
        </Button>
      </div>

      {generated && (
        <Card className="p-4 border border-teal-500/30 bg-teal-500/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-sm">Username: {generated.username} · Password: {generated.password}</p>
            <Button size="sm" onClick={() => navigator.clipboard?.writeText(`Username: ${generated.username}\nPassword: ${generated.password}`)}>Copy</Button>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" placeholder="Search credentials..." />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-white/5 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left p-3">Member</th>
                <th className="text-left p-3">Username</th>
                <th className="text-left p-3">Password</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Last Reset</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="p-3 min-w-56"><div className="flex items-center gap-2"><Avatar name={u.name} gradient={u.avatar} size={32} /><div><p className="font-semibold">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div></div></td>
                  <td className="p-3 font-mono">{u.username}</td>
                  <td className="p-3 font-mono">{visible ? u.password : "••••••••"}</td>
                  <td className="p-3"><Badge tone={u.role === "Super Admin" ? "fuchsia" : "slate"}>{u.role}</Badge></td>
                  <td className="p-3 text-slate-500">{u.passwordResetHistory?.at(-1)?.at ? new Date(u.passwordResetHistory.at(-1)!.at).toLocaleString() : "Never"}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" icon={<KeyRound className="h-3 w-3" />} onClick={() => reset(u.id)}>Reset</Button>
                    <Button size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(`Username: ${u.username}\nPassword: ${u.password}`)}>Copy</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}