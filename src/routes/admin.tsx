import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  ADMIN_DEFAULT_PASSWORD,
  clearOverrides,
  DEFAULT_PUZZLES,
  getOverrides,
  getPuzzles,
  getVaultCode,
  saveOverrides,
  type Hint,
  type MusicQuestion,
  type Puzzle,
} from "@/game/content";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — The Basement Escape" }] }),
  component: AdminPage,
});

const PW_KEY = "be_admin_pw";

function getStoredPassword(): string {
  if (typeof window === "undefined") return ADMIN_DEFAULT_PASSWORD;
  return window.localStorage.getItem(PW_KEY) ?? ADMIN_DEFAULT_PASSWORD;
}
function setStoredPassword(p: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PW_KEY, p);
}

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    // Auto-allow if a session flag is set
    if (typeof window !== "undefined" && sessionStorage.getItem("be_admin_ok") === "1") {
      setAuthed(true);
    }
  }, []);

  function tryLogin(e: React.FormEvent) {
    e.preventDefault();
    const stored = getStoredPassword();
    if (pwInput === stored) {
      setAuthed(true);
      sessionStorage.setItem("be_admin_ok", "1");
    } else {
      setPwError("Incorrect password.");
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <form onSubmit={tryLogin} className="stone-panel rounded-xl p-6 w-full max-w-sm space-y-4">
          <div>
            <div className="font-display text-xs uppercase tracking-widest text-gold">
              Host Admin
            </div>
            <h1 className="font-display text-2xl mt-1">Enter password</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Default: <code className="text-gold">{ADMIN_DEFAULT_PASSWORD}</code> (change it
              below after login)
            </p>
          </div>
          <Input
            type="password"
            value={pwInput}
            onChange={(e) => {
              setPwInput(e.target.value);
              setPwError("");
            }}
            placeholder="Password"
            autoFocus
            className="h-11"
          />
          {pwError && <div className="text-sm text-destructive">{pwError}</div>}
          <Button type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
            Unlock
          </Button>
          <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-gold">
            ← Back to title
          </Link>
        </form>
      </div>
    );
  }

  return <Editor />;
}

function Editor() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>(getPuzzles());
  const [savedAt, setSavedAt] = useState<string>("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const vaultCode = useMemo(() => puzzles.map((p) => p.artifact).join(""), [puzzles]);

  function updatePuzzle(id: number, patch: Partial<Puzzle>) {
    setPuzzles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function updateHint(id: number, tier: 1 | 2 | 3, patch: Partial<Hint>) {
    setPuzzles((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              hints: p.hints.map((h) => (h.tier === tier ? { ...h, ...patch } : h)) as Hint[],
            }
          : p
      )
    );
  }

  function updateMusicQuestion(id: number, qIdx: number, patch: Partial<MusicQuestion>) {
    setPuzzles((prev) =>
      prev.map((p) => {
        if (p.id !== id || !p.musicQuestions) return p;
        const next = p.musicQuestions.map((q, i) => (i === qIdx ? { ...q, ...patch } : q));
        return { ...p, musicQuestions: next };
      })
    );
  }

  function buildOverrides(): Partial<Record<number, Partial<Puzzle>>> {
    const out: Partial<Record<number, Partial<Puzzle>>> = {};
    puzzles.forEach((p) => {
      const def = DEFAULT_PUZZLES.find((d) => d.id === p.id)!;
      const diff: Partial<Puzzle> = {};
      (["title", "flavor", "scripture", "artifact", "answer"] as const).forEach((k) => {
        if ((p[k] ?? "") !== (def[k] ?? "")) (diff as any)[k] = p[k];
      });
      const accNew = (p.acceptable ?? []).join(",");
      const accDef = (def.acceptable ?? []).join(",");
      if (accNew !== accDef) diff.acceptable = p.acceptable;
      const hintsChanged = p.hints.some((h, i) => {
        const dh = def.hints[i];
        return !dh || h.label !== dh.label || h.text !== dh.text;
      });
      if (hintsChanged) diff.hints = p.hints;
      if (p.musicQuestions || def.musicQuestions) {
        const a = JSON.stringify(p.musicQuestions ?? []);
        const b = JSON.stringify(def.musicQuestions ?? []);
        if (a !== b) diff.musicQuestions = p.musicQuestions;
      }
      if (Object.keys(diff).length > 0) out[p.id] = diff;
    });
    return out;
  }

  function save() {
    saveOverrides(buildOverrides());
    setSavedAt(new Date().toLocaleTimeString());
  }

  function resetPuzzle(id: number) {
    const def = DEFAULT_PUZZLES.find((d) => d.id === id)!;
    setPuzzles((prev) => prev.map((p) => (p.id === id ? { ...def } : p)));
  }

  function resetAll() {
    if (!confirm("Reset ALL puzzle content to defaults?")) return;
    clearOverrides();
    setPuzzles(DEFAULT_PUZZLES.map((p) => ({ ...p })));
    setSavedAt(new Date().toLocaleTimeString());
  }

  function exportJson() {
    const data = JSON.stringify(buildOverrides(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "basement-escape-overrides.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        saveOverrides(parsed);
        setPuzzles(getPuzzles());
        setSavedAt(new Date().toLocaleTimeString());
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  }

  function changePassword() {
    if (newPw.trim().length < 4) {
      setPwMsg("Password must be at least 4 characters.");
      return;
    }
    setStoredPassword(newPw.trim());
    setNewPw("");
    setPwMsg("Password updated.");
    setTimeout(() => setPwMsg(""), 2500);
  }

  function logout() {
    sessionStorage.removeItem("be_admin_ok");
    window.location.reload();
  }

  // load fresh on mount in case overrides changed elsewhere
  useEffect(() => {
    setPuzzles(getPuzzles());
  }, []);

  return (
    <div className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display text-xs uppercase tracking-widest text-gold">
              Host Admin
            </div>
            <h1 className="font-display text-3xl md:text-4xl">Puzzle Editor</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm">← Title</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={logout}>
              Lock admin
            </Button>
          </div>
        </header>

        <div className="stone-panel mt-6 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display text-xs uppercase tracking-widest text-gold">
              Live Vault Code
            </div>
            <div className="font-display text-2xl tracking-[0.3em] text-gold mt-1">
              {vaultCode || "—"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} className="bg-gold text-gold-foreground hover:bg-gold/90">
              Save changes
            </Button>
            <Button variant="outline" onClick={exportJson}>Export JSON</Button>
            <label className="inline-flex">
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importJson(f);
                  e.target.value = "";
                }}
              />
              <span className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground">
                Import JSON
              </span>
            </label>
            <Button
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={resetAll}
            >
              Reset all
            </Button>
          </div>
        </div>
        {savedAt && (
          <div className="text-xs text-gold mt-2">Saved at {savedAt}</div>
        )}

        <div className="stone-panel mt-4 rounded-xl p-4">
          <div className="font-display text-xs uppercase tracking-widest text-gold">
            Admin password
          </div>
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            <Input
              type="text"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New password"
              className="h-9 max-w-xs"
            />
            <Button size="sm" variant="outline" onClick={changePassword}>
              Update password
            </Button>
            {pwMsg && <span className="text-xs text-muted-foreground">{pwMsg}</span>}
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {puzzles.map((p) => (
            <PuzzleEditor
              key={p.id}
              puzzle={p}
              onChange={(patch) => updatePuzzle(p.id, patch)}
              onHintChange={(tier, patch) => updateHint(p.id, tier, patch)}
              onMusicChange={(qIdx, patch) => updateMusicQuestion(p.id, qIdx, patch)}
              onReset={() => resetPuzzle(p.id)}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={save} className="bg-gold text-gold-foreground hover:bg-gold/90">
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function PuzzleEditor({
  puzzle,
  onChange,
  onHintChange,
  onReset,
}: {
  puzzle: Puzzle;
  onChange: (patch: Partial<Puzzle>) => void;
  onHintChange: (tier: 1 | 2 | 3, patch: Partial<Hint>) => void;
  onReset: () => void;
}) {
  return (
    <div className="stone-panel rounded-xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="font-display text-gold">
          Lock {puzzle.id} — Artifact{" "}
          <span className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded border border-gold/50 bg-background/40">
            {puzzle.artifact}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset to default
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="Title">
          <Input value={puzzle.title} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>
        <Field label="Artifact (1 char)">
          <Input
            value={puzzle.artifact}
            maxLength={1}
            onChange={(e) => onChange({ artifact: e.target.value.slice(0, 1) })}
          />
        </Field>
        <Field label="Flavor">
          <Textarea
            value={puzzle.flavor}
            onChange={(e) => onChange({ flavor: e.target.value })}
            rows={2}
          />
        </Field>
        <Field label="Scripture (optional)">
          <Textarea
            value={puzzle.scripture ?? ""}
            onChange={(e) => onChange({ scripture: e.target.value })}
            rows={2}
          />
        </Field>
        <Field label="Answer (canonical)">
          <Input value={puzzle.answer} onChange={(e) => onChange({ answer: e.target.value })} />
        </Field>
        <Field label="Acceptable answers (comma-separated)">
          <Input
            value={(puzzle.acceptable ?? []).join(", ")}
            onChange={(e) =>
              onChange({
                acceptable: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
      </div>

      <div className="mt-4 space-y-2">
        {puzzle.hints.map((h) => (
          <div key={h.tier} className="rounded border border-border bg-background/30 p-3">
            <div className="grid gap-2 md:grid-cols-[120px_1fr]">
              <Input
                value={h.label}
                onChange={(e) => onHintChange(h.tier, { label: e.target.value })}
                placeholder={`Hint ${h.tier} label`}
              />
              <Textarea
                value={h.text}
                onChange={(e) => onHintChange(h.tier, { text: e.target.value })}
                rows={2}
                placeholder={`Hint ${h.tier} text`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}
