"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Users, UserPlus, Key, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [mode, setMode] = useState<"create" | "join">("create");
  const [displayName, setDisplayName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/me");
        if (res.status === 401) {
          // Redirect to sign in if unauthenticated
          router.push("/api/auth/login?mock=true&role=user");
          return;
        }
        const data = await res.json();
        if (data.authenticated) {
          setSession(data.user);
          setDisplayName(data.user.name || "");
          if (data.user.team) {
            setTeamName(data.user.team.name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch session:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const payload: any = {
        displayName: displayName.trim(),
      };

      if (mode === "create") {
        if (!teamName.trim() || teamName.trim().length < 3) {
          setErrorMsg("Team name must be at least 3 characters long.");
          setSubmitting(false);
          return;
        }
        payload.teamName = teamName.trim();
      } else {
        if (!joinCode.trim()) {
          setErrorMsg("Please provide a valid 6-character team invite code.");
          setSubmitting(false);
          return;
        }
        payload.joinCode = joinCode.trim().toUpperCase();
      }

      const res = await fetch("/api/teams/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to register team.");
        setSubmitting(false);
        return;
      }

      // Success -> navigate to lobby
      router.push("/lobby");
    } catch (err) {
      setErrorMsg("Network error occurred: " + (err as Error).message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center font-mono">
        <div className="text-cyan-400 animate-pulse text-sm">Validating authentication session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      <Navbar user={session} />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-lg bg-cyan-950/80 border border-cyan-500/40 mx-auto flex items-center justify-center text-cyan-400">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white">Team Registration</h1>
            <p className="text-xs text-neutral-400">
              Set your competitor identity and establish team credentials for competition scoring.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded bg-rose-950/30 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("create");
                setErrorMsg(null);
              }}
              className={`py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 ${
                mode === "create"
                  ? "bg-neutral-800 text-cyan-400 font-bold border border-neutral-700"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Team
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("join");
                setErrorMsg(null);
              }}
              className={`py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 ${
                mode === "join"
                  ? "bg-neutral-800 text-cyan-400 font-bold border border-neutral-700"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              Join via Code
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-neutral-400 mb-1">Competitor Display Name:</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Cipher Specialist 01"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {mode === "create" ? (
              <div>
                <label className="block text-neutral-400 mb-1">New Team Name:</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Cyber Syndicate"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500 font-mono"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  A unique 6-character invite code will be generated for your teammates.
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-neutral-400 mb-1">Team Invite Code:</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2C3"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-cyan-300 font-bold uppercase tracking-widest outline-none focus:border-cyan-500 font-mono"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Ask your team leader for the 6-character code.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-neutral-950 font-bold transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {submitting ? (
                "Processing..."
              ) : (
                <>
                  <span>{mode === "create" ? "Establish Team & Enter Lobby" : "Join Team & Enter Lobby"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Authoritative server authentication & membership verification</span>
          </div>
        </div>
      </main>
    </div>
  );
}
