import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "glass rounded-2xl shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      {children}
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
}
export function Button({ className, variant = "primary", size = "md", icon, children, ...rest }: ButtonProps) {
  const variants: Record<string, string> = {
    primary:
      "soc-bg-teal text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]",
    secondary:
      "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-200/60 dark:text-slate-200 dark:hover:bg-white/10",
    danger:
      "soc-bg-rose text-white shadow-md hover:shadow-lg",
    outline:
      "border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={cn(
        "w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500",
        "dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500",
        className
      )}
    />
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      className={cn(
        "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 min-h-[88px]",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500",
        "dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500",
        className
      )}
    />
  );
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={cn(
        "w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-slate-900",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500",
        "dark:border-white/10 dark:bg-slate-900 dark:text-white",
        className
      )}
    >
      {children}
    </select>
  );
}

export function Label({ className, children, ...rest }: HTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...rest}
      className={cn(
        "block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5",
        className
      )}
    >
      {children}
    </label>
  );
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "indigo" | "emerald" | "amber" | "rose" | "sky" | "slate" | "violet" | "fuchsia";
}
export function Badge({ tone = "slate", className, children, ...rest }: BadgeProps) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 ring-indigo-500/20",
    emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20",
    amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/20",
    rose: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/20",
    sky: "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/20",
    slate: "bg-slate-500/15 text-slate-700 dark:text-slate-300 ring-slate-500/20",
    violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/20",
    fuchsia: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 ring-fuchsia-500/20",
  };
  return (
    <span
      {...rest}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ring-1 ring-inset",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({ name, gradient, size = 40, src }: { name: string; gradient?: string; size?: number; src?: string }) {
  const initials = name
    .replace(/\(.+?\)/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0"
      />
    );
  }
  
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white shrink-0",
        gradient === "orange" ? "bg-orange-500" : gradient === "rose" ? "bg-rose-500" : gradient === "amber" ? "bg-amber-500" : gradient === "blue" ? "bg-blue-600" : gradient === "cyan" ? "bg-cyan-500" : gradient === "slate" ? "bg-slate-700" : "bg-teal-600"
      )}
    >
      {initials}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!open) return null;
  const sizes = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative w-full glass-strong rounded-2xl shadow-2xl flex flex-col max-h-[90vh]", sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-white/10">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10"
          >
            ✕
          </button>
        </div>
        <div className="p-6 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-12">
      {icon && <div className="mx-auto mb-3 text-slate-400">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {body && <p className="text-sm text-slate-500 mt-1">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
