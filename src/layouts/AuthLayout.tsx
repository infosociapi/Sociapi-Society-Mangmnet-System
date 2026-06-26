import { Outlet } from "react-router-dom";
import { Logo } from "../components/Logo";

export default function AuthLayout() {
  return (
    <div className="min-h-screen auth-bg flex flex-col lg:flex-row text-white">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-1 flex-col p-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/30 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/20 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <Logo />
        <div className="mt-auto relative">
          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            The AI Operating System for <span className="text-teal-300">modern organizations</span>.
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-xl">
            Run Sociapi Society with enterprise-grade ERP tools for members, tasks, finance, outreach, HR, events and AI insights.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-xl">
            {[
              { k: "20+", v: "Active Members" },
              { k: "8", v: "Departments" },
              { k: "AI", v: "Command Center" },
            ].map((s) => (
              <div key={s.v} className="glass rounded-2xl p-4">
                <p className="text-2xl font-bold">{s.k}</p>
                <p className="text-xs text-white/70 uppercase tracking-wider">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>
          <div className="glass-strong rounded-3xl p-8 shadow-2xl text-slate-900 dark:text-white">
            <Outlet />
          </div>
          <p className="text-center text-xs text-white/60 mt-6">© 2026 Sociapi Society ERP. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
