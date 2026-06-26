import { useState } from "react";
import { Avatar, Badge, Button, Card, Input } from "../components/ui";
import { useApp } from "../context/AppContext";
import { KeyRound, Search, ShieldAlert, Trash2, UserX } from "lucide-react";
import { sendResendEmail } from "../lib/resend";

function makePassword() {
  return `Sociapi@2026#${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export default function AccountManagement() {
  const { users, activityLogs, isSuperAdmin, suspendUser, resetUserPassword, deleteUser, addNotification } = useApp();
  const [q, setQ] = useState("");
  const [lastGenerated, setLastGenerated] = useState<{ user: string; username: string; password: string } | null>(null);
  const [mailStatus, setMailStatus] = useState("");

  if (!isSuperAdmin()) {
    return (
      <Card className="p-10 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-amber-500 mb-3" />
        <p className="font-semibold">Super Admin Only</p>
        <p className="text-sm text-slate-500">Only Muhammad Zuhair Zeb can access Account Management.</p>
      </Card>
    );
  }

  const filtered = users.filter((u) => {
    const s = q.toLowerCase();
    return !s || u.name.toLowerCase().includes(s) || u.username.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  const lastActivityFor = (id: string) => activityLogs.find((l) => l.actorId === id || l.target === id)?.createdAt;
  const creatorName = (id?: string) => {
    if (!id) return "System";
    if (id === "self-registration") return "Self Registration";
    return users.find((u) => u.id === id)?.name || id;
  };

  const reset = (id: string) => {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    const pw = makePassword();
    resetUserPassword(id, pw);
    setLastGenerated({ user: u.name, username: u.username, password: pw });
  };

  const sendCredentials = async () => {
    if (!lastGenerated) return;
    const user = users.find((u) => u.name === lastGenerated.user);
    const to = user?.email || "sociapisociety@gmail.com";
    setMailStatus("Sending via Resend...");
    try {
      await sendResendEmail({
        to,
        subject: "Your Sociapi Society ERP credentials",
        html: `<p>Your account credentials:</p><p><strong>Username:</strong> ${lastGenerated.username}</p><p><strong>Password:</strong> ${lastGenerated.password}</p>`,
      });
      setMailStatus(`Email sent to ${to}`);
      addNotification({ title: "Credentials Email Sent", body: `Credentials sent to ${to}`, channel: "Email", type: "success" });
    } catch (error) {
      setMailStatus(`Email failed: ${error instanceof Error ? error.message : "API not configured"}. If using onboarding@resend.dev, the recipient must be the verified Resend account email or you must verify a domain.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Management</h1>
          <p className="text-sm text-slate-500">Super Admin controls for credentials, access, status and audit visibility.</p>
        </div>
        <div className="flex gap-2">
          <Badge tone="emerald">{users.filter((u) => u.status === "Active").length} active</Badge>
          <Badge tone="indigo">{users.filter((u) => u.lastLogin).length} logged in</Badge>
        </div>
      </div>

      {lastGenerated && (
        <Card className="p-4 border border-emerald-500/30 bg-emerald-500/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">Temporary credentials generated for {lastGenerated.user}</p>
              <p className="text-sm font-mono mt-1">Username: {lastGenerated.username} · Password: {lastGenerated.password}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(`Username: ${lastGenerated.username}\nPassword: ${lastGenerated.password}`)}>Copy</Button>
              <Button size="sm" onClick={sendCredentials}>Send Email</Button>
            </div>
          </div>
          {mailStatus && <p className="text-xs text-slate-500 mt-2">{mailStatus}</p>}
        </Card>
      )}

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" placeholder="Search accounts by name, username or email..." />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100/70 dark:bg-white/5 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left p-3">Member</th>
                <th className="text-left p-3">Username</th>
                <th className="text-left p-3">Credentials</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Created By</th>
                <th className="text-left p-3">Created Date</th>
                <th className="text-left p-3">Last Login</th>
                <th className="text-left p-3">Last Activity</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {filtered.map((u) => {
                const lastAct = lastActivityFor(u.id);
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="p-3 min-w-60">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} gradient={u.avatar} size={36} />
                        <div>
                          <p className="font-semibold">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono">{u.username}</td>
                    <td className="p-3 text-slate-500">Stored in Supabase Auth only. Generate a temporary password to copy/email it once.</td>
                    <td className="p-3"><Badge tone={u.role === "Super Admin" ? "fuchsia" : "indigo"}>{u.role}</Badge></td>
                    <td className="p-3"><Badge tone={u.status === "Active" ? "emerald" : u.status === "Suspended" ? "rose" : "slate"}>{u.status}</Badge></td>
                    <td className="p-3 text-slate-500">{creatorName(u.createdBy)}</td>
                    <td className="p-3 text-slate-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Seeded"}</td>
                    <td className="p-3 text-slate-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}</td>
                    <td className="p-3 text-slate-500">{lastAct ? new Date(lastAct).toLocaleString() : "—"}</td>
                    <td className="p-3 text-right">
                      {u.role === "Super Admin" ? (
                        <span className="text-xs text-amber-600 dark:text-amber-400">🔒 Protected</span>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" icon={<KeyRound className="h-3 w-3" />} onClick={() => reset(u.id)}>Generate</Button>
                          <Button size="sm" variant="ghost" icon={<UserX className="h-3 w-3" />} onClick={() => suspendUser(u.id)}>{u.status === "Suspended" ? "Activate" : "Suspend"}</Button>
                          <Button size="sm" variant="ghost" icon={<Trash2 className="h-3 w-3" />} onClick={() => { if (confirm(`Delete ${u.name}?`)) deleteUser(u.id); }}>Delete</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}