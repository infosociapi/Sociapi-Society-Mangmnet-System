import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Label } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { KeyRound } from "lucide-react";

export default function Forgot() {
  const { forgotPassword } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const r = forgotPassword(email);
    if (!r.ok) setError(r.error || "");
    else setToken(r.token || "");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Forgot password?</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        We'll generate a secure reset token for your email.
      </p>

      {!token ? (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <p className="text-xs text-rose-600 bg-rose-500/10 px-3 py-2 rounded-lg">{error}</p>}
          <Button type="submit" className="w-full" size="lg" icon={<KeyRound className="h-4 w-4" />}>
            Send reset token
          </Button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Reset token generated</p>
            <p className="text-xs text-slate-500 mt-1">In production this token would be emailed. For demo:</p>
            <code className="block mt-2 px-3 py-2 rounded-lg bg-slate-900 text-emerald-300 font-mono text-sm">{token}</code>
          </div>
          <Button className="w-full" size="lg" onClick={() => nav(`/reset?token=${token}`)}>
            Continue to reset
          </Button>
        </div>
      )}

      <p className="text-sm text-center mt-6 text-slate-500 dark:text-slate-400">
        Remembered it?{" "}
        <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
