"use client";
import type { ReactNode } from "react";

export function Tabs({ items, active, onChange }: { items: Array<{ id: string; label: string; panel: ReactNode }>; active: string; onChange: (id: string) => void }) {
  const selected = items.find((item) => item.id === active) || items[0];
  return <div><div role="tablist" className="flex gap-1 border-b border-zinc-800">{items.map((item) => <button key={item.id} role="tab" aria-selected={item.id === selected.id} aria-controls={`${item.id}-panel`} onClick={() => onChange(item.id)} className={`px-4 py-2 text-sm ${item.id === selected.id ? "border-b-2 border-cyan-400 text-white" : "text-zinc-400"}`}>{item.label}</button>)}</div><div id={`${selected.id}-panel`} role="tabpanel" className="pt-4">{selected.panel}</div></div>;
}
