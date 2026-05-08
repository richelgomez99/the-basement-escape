import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_DEFAULT_PASSWORD } from "@/game/content";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PW_KEY = "be_admin_pw";

type SessionRow = {
  id: string;
  team_name: string;
  leader_name: string | null;
  leader_email: string | null;
  started_at: string;
  finished_at: string | null;
  outcome: string;
  elapsed_seconds: number | null;
  penalty_seconds: number;
  solved_count: number;
};

export const listSessions = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("game_sessions")
    .select(
      "id,team_name,leader_name,leader_email,started_at,finished_at,outcome,elapsed_seconds,penalty_seconds,solved_count",
    )
    .order("started_at", { ascending: false })
    .limit(500);
  if (error) {
    return { sessions: [] as SessionRow[], error: error.message };
  }
  return { sessions: (data ?? []) as SessionRow[], error: null };
});

export const Route = createFileRoute("/admin-sessions")({
  head: () => ({ meta: [{ title: "Sessions — Admin" }] }),
  component: AdminSessions,
});

function fmt(secs: number | null): string {
  if (secs == null) return "—";
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function AdminSessions() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(PW_KEY);
    if (stored && stored === (window.localStorage.getItem(PW_KEY) ?? ADMIN_DEFAULT_PASSWORD)) {
      // Match either user-set password OR default
      const expected = window.localStorage.getItem(PW_KEY) ?? ADMIN_DEFAULT_PASSWORD;
      if (stored === expected) setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    listSessions()
      .then((r) => {
        setSessions(r.sessions);
        setErr(r.error);
      })
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [authed]);

  function tryAuth(e: React.FormEvent) {
    e.preventDefault();
    if (typeof window === "undefined") return;
    const expected = window.localStorage.getItem(PW_KEY) ?? ADMIN_DEFAULT_PASSWORD;
    if (pw === expected) {
      window.localStorage.setItem(PW_KEY, expected);
      setAuthed(true);
    } else {
      setErr("Wrong password");
    }
  }

  function exportCsv() {
    const header = [
      "team_name",
      "leader_name",
      "leader_email",
      "started_at",
      "finished_at",
      "outcome",
      "elapsed_seconds",
      "penalty_seconds",
      "solved_count",
    ];
    const rows = sessions.map((s) =>
      [
        JSON.stringify(s.team_name ?? ""),
        JSON.stringify(s.leader_name ?? ""),
        JSON.stringify(s.leader_email ?? ""),
        s.started_at,
        s.finished_at ?? "",
        s.outcome,
        s.elapsed_seconds ?? "",
        s.penalty_seconds,
        s.solved_count,
      ].join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `basement-escape-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <form onSubmit={tryAuth} className="stone-panel rounded-xl p-6 w-full max-w-sm space-y-3">
          <h1 className="font-display text-xl text-gold">Admin · Sessions</h1>
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Admin password"
            autoFocus
          />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
            Enter
          </Button>
          <Link to="/admin" className="block text-xs text-center text-muted-foreground hover:text-gold">
            ← Back to content editor
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <header className="mx-auto max-w-6xl flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-gold">Team Sessions</h1>
          <p className="text-xs text-muted-foreground">
            Private — only visible here. Not a public leaderboard.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!sessions.length}>
            Export CSV
          </Button>
          <Link to="/admin">
            <Button variant="outline" size="sm" className="border-gold/40">
              ← Editor
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-6xl">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {err && <p className="text-sm text-destructive">{err}</p>}
        {!loading && sessions.length === 0 && (
          <p className="text-sm text-muted-foreground">No sessions yet.</p>
        )}
        {sessions.length > 0 && (
          <div className="stone-panel rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-left text-xs uppercase tracking-widest text-gold">
                <tr>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2">Leader</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Started</th>
                  <th className="px-3 py-2">Finished</th>
                  <th className="px-3 py-2">Outcome</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Penalty</th>
                  <th className="px-3 py-2">Solved</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-t border-border/40">
                    <td className="px-3 py-2 font-display">{s.team_name}</td>
                    <td className="px-3 py-2">{s.leader_name ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {s.leader_email ? (
                        <a href={`mailto:${s.leader_email}`} className="hover:text-gold">
                          {s.leader_email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(s.started_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {s.finished_at ? new Date(s.finished_at).toLocaleString() : "—"}
                    </td>
                    <td
                      className={`px-3 py-2 ${
                        s.outcome === "victory"
                          ? "text-gold"
                          : s.outcome === "failure"
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {s.outcome}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{fmt(s.elapsed_seconds)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmt(s.penalty_seconds)}</td>
                    <td className="px-3 py-2 tabular-nums">{s.solved_count} / 9</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
