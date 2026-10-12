import type { InputHTMLAttributes } from "react";

export function Field({ label, error, hint, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const fieldId = id || props.name;
  const descriptionId = `${fieldId}-description`;
  return <label className="grid gap-2 text-sm text-zinc-200" htmlFor={fieldId}><span className="font-medium">{label}</span><input id={fieldId} aria-invalid={!!error} aria-describedby={hint || error ? descriptionId : undefined} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white placeholder:text-zinc-600 focus:border-cyan-500" {...props} />{(error || hint) ? <span id={descriptionId} className={`text-xs ${error ? "text-rose-300" : "text-zinc-500"}`}>{error || hint}</span> : null}</label>;
}
