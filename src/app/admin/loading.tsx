export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-8" aria-live="polite">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-zinc-800" />
          <div className="h-8 w-64 rounded bg-zinc-800" />
          <div className="h-4 w-96 rounded bg-zinc-900" />
        </div>
        <div className="h-10 w-36 rounded-lg bg-zinc-800" />
      </div>
      <div className="h-40 rounded-2xl border border-zinc-800/80 bg-[#0e1016]/60 p-6" />
      <div className="h-64 rounded-2xl border border-zinc-800/80 bg-[#0e1016]/60 p-6" />
    </div>
  );
}
