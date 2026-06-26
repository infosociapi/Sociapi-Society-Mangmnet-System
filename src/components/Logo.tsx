import { cn } from "../utils/cn";

export function Logo({ size = 36, withText = true, className }: { size?: number; withText?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        style={{ width: size, height: size }}
        className="relative rounded-xl soc-bg-main shadow-lg shadow-indigo-500/30 flex items-center justify-center"
      >
        <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 text-white" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <circle cx="5" cy="6" r="2" />
          <circle cx="19" cy="6" r="2" />
          <circle cx="5" cy="18" r="2" />
          <circle cx="19" cy="18" r="2" />
          <path d="M7 7l3 3M17 7l-3 3M7 17l3-3M17 17l-3-3" />
        </svg>
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
      </div>
      {withText && (
        <div className="leading-tight">
          <div className="font-bold tracking-tight text-base">
            Sociapi <span className="text-indigo-600 dark:text-indigo-400">Society Management System </span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Society MS</div>
        </div>
      )}
    </div>
  );
}
