import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input, Label } from "../../components/ui";
import { supabase, isSupabaseConfigured, supabaseConfigMessage } from "../../lib/supabase";
import { KeyRound, MailCheck } from "lucide-react";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isSupabaseConfigured) {
      setError(supabaseConfigMessage);
      return;
    }

    setLoading(true);

    // Supabase sends a password recovery email. The link opens /reset where the
    // user sets a new password using the recovery session.
    const redirectTo = `${window.location.origin}${window.location.pathname}#/reset`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Forgot password?</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Enter your email and we'll send you a secure Supabase reset link.
      </p>

      {!sent ? (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@sociapi.org"
            />
          </div>
          {error && <p className="text-xs text-rose-600 bg-rose-500/10 px-3 py-2 rounded-lg">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full" size="lg" icon={<KeyRound className="h-4 w-4" />}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex gap-3">
            <MailCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Reset link sent</p>
              <p className="text-xs text-slate-500 mt-1">
                Check <span className="font-semibold">{email}</span> for a password reset email from Supabase.
                Open the link to set a new password.
              </p>
            </div>
          </div>
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
