import type { ReactNode } from "react";

export function StatusBadge({ tone = "neutral", children }: { tone?: "neutral" | "info" | "success" | "warning" | "danger"; children: ReactNode }) {
  const tones = { neutral: "border-zinc-700 bg-zinc-900 text-zinc-300", info: "border-cyan-800 bg-cyan-950/50 text-cyan-300", success: "border-emerald-800 bg-emerald-950/50 text-emerald-300", warning: "border-amber-800 bg-amber-950/50 text-amber-300", danger: "border-rose-800 bg-rose-950/50 text-rose-300" };
  return <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}
