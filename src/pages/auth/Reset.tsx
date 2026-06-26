import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Input, Label } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { ShieldCheck } from "lucide-react";

export default function Reset() {
  const { resetPassword } = useApp();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [token, setToken] = useState(params.get("token") || "");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pw !== confirm) return setError("Passwords do not match.");
    if (pw.length < 6) return setError("Password must be at least 6 characters.");
    const r = resetPassword(token, pw);
    if (!r.ok) setError(r.error || "Invalid token");
    else {
      setDone(true);
      setTimeout(() => nav("/login"), 1500);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Reset password</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter your token and a new password.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label>Reset token</Label>
          <Input value={token} onChange={(e) => setToken(e.target.value)} required />
        </div>
        <div>
          <Label>New password</Label>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        </div>
        <div>
          <Label>Confirm password</Label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        {error && <p className="text-xs text-rose-600 bg-rose-500/10 px-3 py-2 rounded-lg">{error}</p>}
        {done && <p className="text-xs text-emerald-600 bg-emerald-500/10 px-3 py-2 rounded-lg">Password updated. Redirecting…</p>}
        <Button type="submit" className="w-full" size="lg" icon={<ShieldCheck className="h-4 w-4" />}>
          Reset password
        </Button>
      </form>

      <p className="text-sm text-center mt-6 text-slate-500 dark:text-slate-400">
        <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
