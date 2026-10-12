import type { ReactNode } from "react";

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "danger" | "success" }) {
  const color = tone === "danger" ? "border-rose-800 bg-rose-950/30 text-rose-200" : tone === "success" ? "border-emerald-800 bg-emerald-950/30 text-emerald-200" : "border-cyan-900 bg-cyan-950/30 text-cyan-100";
  return <div role="status" className={`rounded-xl border p-4 text-sm ${color}`}>{children}</div>;
}
