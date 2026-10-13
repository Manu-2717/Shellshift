"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
type Hint = {
  title: string;
  content: string;
  penaltySeconds: number;
  pointPenalty: number;
  order: number;
};
type Details = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimitSeconds: number;
  isPublished: boolean;
  hints: Hint[];
};
export function ChallengeDetailsEditor({ initial }: { initial: Details }) {
  const router = useRouter(),
    [data, setData] = useState(initial),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const hint = (i: number, p: Partial<Hint>) =>
    setData((c) => ({
      ...c,
      hints: c.hints.map((h, n) => (n === i ? { ...h, ...p } : h)),
    }));
  const save = async () => {
    setSaving(true);
    setError("");
    const { id: _, ...payload } = data;
    const response = await fetch(`/api/admin/challenges/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      result = await response.json();
    setSaving(false);
    if (!response.ok)
      return setError(result.error || "Unable to save challenge details.");
    router.refresh();
  };
  return (
    <section className="grid gap-5 rounded-2xl border border-zinc-800 bg-[#0e1016] p-6">
      <h2 className="text-lg font-semibold">Player-facing details</h2>
      <Field
        label="Title"
        value={data.title}
        onChange={(e) => setData({ ...data, title: e.target.value })}
      />
      <label className="grid gap-2 text-sm">
        Description
        <textarea
          className="min-h-24 rounded-lg border border-zinc-700 bg-black/30 p-3"
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          Difficulty
          <select
            className="rounded-lg border border-zinc-700 bg-black/30 p-3"
            value={data.difficulty}
            onChange={(e) => setData({ ...data, difficulty: e.target.value })}
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </label>
        <Field
          label="Time limit (seconds)"
          type="number"
          value={data.timeLimitSeconds}
          onChange={(e) =>
            setData({ ...data, timeLimitSeconds: Number(e.target.value) })
          }
        />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={data.isPublished}
          onChange={(e) => setData({ ...data, isPublished: e.target.checked })}
        />
        Available for new games
      </label>
      <div className="grid gap-3">
        <h3 className="font-medium">Progressive hints</h3>
        {data.hints.map((h, i) => (
          <div
            key={i}
            className="grid gap-2 rounded-xl border border-zinc-800 p-4"
          >
            <Field
              label={`Hint ${i + 1} title`}
              value={h.title}
              onChange={(e) => hint(i, { title: e.target.value })}
            />
            <textarea
              aria-label={`Hint ${i + 1} text`}
              className="rounded-lg border border-zinc-700 bg-black/30 p-3 text-sm"
              value={h.content}
              onChange={(e) => hint(i, { content: e.target.value })}
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                disabled={i === 0}
                onClick={() =>
                  setData((c) => ({
                    ...c,
                    hints: c.hints.map((x, n) =>
                      n === i - 1 ? c.hints[i] : n === i ? c.hints[i - 1] : x,
                    ),
                  }))
                }
              >
                Move up
              </Button>
              <Button
                variant="ghost"
                disabled={data.hints.length <= 2}
                onClick={() =>
                  setData((c) => ({
                    ...c,
                    hints: c.hints.filter((_, n) => n !== i),
                  }))
                }
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
        <Button
          variant="ghost"
          onClick={() =>
            setData((c) => ({
              ...c,
              hints: [
                ...c.hints,
                {
                  title: "Next hint",
                  content: "Add a helpful next step.",
                  penaltySeconds: 30,
                  pointPenalty: 25,
                  order: c.hints.length + 1,
                },
              ],
            }))
          }
        >
          Add hint
        </Button>
      </div>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Button className="w-fit" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save details"}
      </Button>
    </section>
  );
}
