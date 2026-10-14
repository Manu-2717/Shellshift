"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Notice } from "@/components/ui/Notice";

export interface GameDangerZoneProps {
  gameId: string;
  name: string;
  status: string;
  registrationCount: number;
  runCount: number;
}

export function GameDangerZone({
  gameId,
  name,
  status,
  registrationCount,
  runCount,
}: GameDangerZoneProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const isEligibleForDeletion =
    status === "DRAFT" && registrationCount === 0 && runCount === 0;

  const handleDelete = async () => {
    if (confirmation.trim() !== name.trim() || pending) return;
    setPending(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to delete game.");
        setPending(false);
        return;
      }
      setIsDeleteDialogOpen(false);
      router.push("/admin/games");
      router.refresh();
    } catch {
      setError("Network error while deleting game.");
      setPending(false);
    }
  };

  const handleArchive = async () => {
    if (pending) return;
    setPending(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/games/${gameId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to archive game.");
        setPending(false);
        return;
      }
      setIsArchiveDialogOpen(false);
      router.refresh();
    } catch {
      setError("Network error while archiving game.");
      setPending(false);
    }
  };

  return (
    <section className="rounded-2xl border border-rose-950/60 bg-gradient-to-b from-rose-950/20 via-[#0e1016] to-[#0e1016] p-6 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="grid size-8 place-items-center rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertTriangle className="size-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Danger zone</h2>
          <p className="text-xs text-zinc-500">
            Irreversible actions and competition lifecycle termination.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {isEligibleForDeletion ? (
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-rose-900/40 bg-black/40 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-medium text-white">Delete unused draft</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Permanently delete this unpublished draft and its lineup links.
              </p>
            </div>
            <Button
              variant="danger"
              className="w-fit shrink-0 shadow-lg shadow-rose-950/50"
              onClick={() => {
                setConfirmation("");
                setError("");
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="size-4" />
              <span>Delete game</span>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            <p className="text-sm text-zinc-400">
              Permanent deletion is only available for unused draft games with
              no registrations or runs. This competition preserves history
              through archival.
            </p>
            {status !== "ARCHIVED" ? (
              <div className="flex flex-col justify-between gap-4 rounded-xl border border-zinc-800 bg-black/40 p-5 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-medium text-white">
                    Archive competition
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    Close the event and remove it from active schedules while
                    retaining all registrations, runs, and scores.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="w-fit shrink-0"
                  onClick={() => {
                    setError("");
                    setIsArchiveDialogOpen(true);
                  }}
                >
                  <Archive className="size-4" />
                  <span>Archive game</span>
                </Button>
              </div>
            ) : (
              <Notice>
                This competition is archived. Historical data, participants, and
                scores remain safely preserved.
              </Notice>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={isDeleteDialogOpen}
        title="Delete game permanently"
        onClose={() => !pending && setIsDeleteDialogOpen(false)}
      >
        <div className="grid gap-4">
          <p className="text-sm text-zinc-300">
            This action cannot be undone. To permanently remove this draft,
            please type the exact game name to confirm:
          </p>
          <p className="rounded-lg border border-rose-950 bg-black/70 p-3 font-mono text-sm font-semibold text-rose-300">
            {name}
          </p>

          <label className="grid gap-2 text-sm text-zinc-400">
            <span>Type the game name:</span>
            <input
              type="text"
              aria-label="Confirmation game name"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={name}
              disabled={pending}
              className="rounded-lg border border-zinc-700 bg-black/50 p-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
            />
          </label>

          {error ? <Notice tone="danger">{error}</Notice> : null}

          <div className="mt-3 flex justify-end gap-3">
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={confirmation.trim() !== name.trim() || pending}
              onClick={handleDelete}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              <span>Delete game</span>
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={isArchiveDialogOpen}
        title="Archive competition"
        onClose={() => !pending && setIsArchiveDialogOpen(false)}
      >
        <div className="grid gap-4">
          <p className="text-sm text-zinc-300">
            Archiving will mark this competition as archived. Registrations,
            runs, and scores will remain preserved in history.
          </p>

          {error ? <Notice tone="danger">{error}</Notice> : null}

          <div className="mt-3 flex justify-end gap-3">
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => setIsArchiveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={handleArchive}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Archive className="size-4" />
              )}
              <span>Confirm Archive</span>
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
