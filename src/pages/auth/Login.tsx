import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Label } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function Login() {
  const { login } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(async () => {
      const r = await login(email, password);
      setLoading(false);
      if (!r.ok) setError(r.error || "Login failed");
      else nav("/app/dashboard");
    }, 400);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Welcome back 👋</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to your Sociapi Society ERP account.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label>Username or Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="muhammad.zuhair.zeb" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="mb-0">Password</Label>
            <Link to="/forgot" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-rose-600 bg-rose-500/10 px-3 py-2 rounded-lg">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full" size="lg" icon={<LogIn className="h-4 w-4" />}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>

      </form>

      <p className="text-sm text-center mt-6 text-slate-500 dark:text-slate-400">
        New here?{" "}
        <Link to="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
