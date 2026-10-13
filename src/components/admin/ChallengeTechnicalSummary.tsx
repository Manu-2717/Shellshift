export type TechnicalSummary = {
  slug: string;
  order: number;
  mappedCommands: number;
  clues: number;
  starterFiles: number;
  objectives: number;
  scoringConfigured: boolean;
};
export function ChallengeTechnicalSummary({
  summary,
}: {
  summary: TechnicalSummary;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#0e1016] p-6">
      <h2 className="text-lg font-semibold">How this challenge works</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Developer-managed details are read-only here.
      </p>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Slug and order</dt>
          <dd>
            {summary.slug} · {summary.order}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Command changes</dt>
          <dd>{summary.mappedCommands}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Clues and starter files</dt>
          <dd>
            {summary.clues} clues · {summary.starterFiles} files
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Goals and scoring</dt>
          <dd>
            {summary.objectives} goals ·{" "}
            {summary.scoringConfigured ? "Configured" : "Missing"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
