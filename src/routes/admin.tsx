import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  ADMIN_DEFAULT_PASSWORD,
  clearOverrides,
  DEFAULT_PUZZLES,
  DEFAULT_VAULT_WORD,
  getIntroText,
  getOverrides,
  getPuzzles,
  getVaultWord,
  loadOverridesFromCloud,
  saveOverridesToCloud,
  type HiddenMarker,
  type HiddenScene,
  type Hint,
  type LibraryBook,
  type LibraryConfig,
  type PathConfig,
  type Puzzle,
  type Question,
  type StainedGlassConfig,
  type TimelineConfig,
  type TimelineEvent,
} from "@/game/content";
import {
  DEFAULT_INTRO_TEXT,
  INTRO_KEY,
  fetchAllNarrations,
  puzzleNarrationKey,
  type NarrationRow,
} from "@/game/narration";
import { generateNarration } from "@/server/narration";
import { Loader2, CheckCircle2, AlertCircle, Volume2 } from "lucide-react";
import cathedralMural from "@/assets/cathedral-mural.jpg";
import stainedGlassImg from "@/assets/stained-glass.jpg";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — The Basement Escape" }] }),
  component: AdminPage,
});

const PW_KEY = "be_admin_pw";

function getStoredPassword(): string {
  // For now: always use the default password so the host can always get in.
  // (The "Update password" form is hidden below.)
  return ADMIN_DEFAULT_PASSWORD;
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

// Puzzles that support multi-question text mode
const MULTI_Q_PUZZLES = new Set([1, 4, 5, 6, 7, 8]);

function Editor() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>(getPuzzles());
  const [introText, setIntroText] = useState<string>(getIntroText());
  const [vaultWord, setVaultWord] = useState<string>(getVaultWord());
  const [savedAt, setSavedAt] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const vaultWordValid = /^[A-Z]{9}$/.test(vaultWord.toUpperCase());

  // Pull latest from cloud once on mount
  useEffect(() => {
    (async () => {
      await loadOverridesFromCloud();
      setPuzzles(getPuzzles());
      setIntroText(getIntroText());
      setVaultWord(getVaultWord());
    })();
  }, []);

  function update(id: number, patch: Partial<Puzzle>) {
    setPuzzles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function buildOverrides(): Partial<Record<number, Partial<Puzzle>>> & { _intro?: string; _vaultWord?: string } {
    const out: Partial<Record<number, Partial<Puzzle>>> & { _intro?: string; _vaultWord?: string } = {};
    puzzles.forEach((p) => {
      const def = DEFAULT_PUZZLES.find((d) => d.id === p.id)!;
      const diff: Partial<Puzzle> = {};
      // NOTE: `artifact` intentionally excluded — letters are derived from the
      // single vault word, not edited per puzzle.
      (["title", "flavor", "scripture", "answer"] as const).forEach((k) => {
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
      // questions / musicQuestions
      const qA = JSON.stringify(p.questions ?? p.musicQuestions ?? []);
      const qB = JSON.stringify(def.questions ?? def.musicQuestions ?? []);
      if (qA !== qB) {
        diff.questions = p.questions ?? p.musicQuestions;
        if (p.id === 8) diff.musicQuestions = diff.questions;
      }
      // hidden scene
      if (p.hiddenScene || def.hiddenScene) {
        const a = JSON.stringify(p.hiddenScene ?? null);
        const b = JSON.stringify(def.hiddenScene ?? null);
        if (a !== b) diff.hiddenScene = p.hiddenScene;
      }
      // path config
      if (p.pathConfig || def.pathConfig) {
        const a = JSON.stringify(p.pathConfig ?? null);
        const b = JSON.stringify(def.pathConfig ?? null);
        if (a !== b) diff.pathConfig = p.pathConfig;
      }
      // library config (puzzle 3)
      if (p.libraryConfig || def.libraryConfig) {
        const a = JSON.stringify(p.libraryConfig ?? null);
        const b = JSON.stringify(def.libraryConfig ?? null);
        if (a !== b) diff.libraryConfig = p.libraryConfig;
      }
      // stained glass config (puzzle 7)
      if (p.stainedGlassConfig || def.stainedGlassConfig) {
        const a = JSON.stringify(p.stainedGlassConfig ?? null);
        const b = JSON.stringify(def.stainedGlassConfig ?? null);
        if (a !== b) diff.stainedGlassConfig = p.stainedGlassConfig;
      }
      // timeline config (puzzle 9)
      if (p.timelineConfig || def.timelineConfig) {
        const a = JSON.stringify(p.timelineConfig ?? null);
        const b = JSON.stringify(def.timelineConfig ?? null);
        if (a !== b) diff.timelineConfig = p.timelineConfig;
      }
      if (Object.keys(diff).length > 0) out[p.id] = diff;
    });
    if (introText.trim() && introText.trim() !== DEFAULT_INTRO_TEXT) {
      out._intro = introText.trim();
    }
    const vw = vaultWord.trim().toUpperCase();
    if (vw && vw.length === 9 && /^[A-Z]{9}$/.test(vw) && vw !== DEFAULT_VAULT_WORD) {
      out._vaultWord = vw;
    }
    return out;
  }

  async function save() {
    setSaving(true);
    setSaveErr("");
    try {
      await saveOverridesToCloud(buildOverrides());
      setSavedAt(new Date().toLocaleTimeString());
      // Trigger narration regeneration for intro + every puzzle flavor.
      // The server function returns instantly if text hasn't changed.
      void triggerAllNarrations(introText, puzzles);
    } catch (e: any) {
      setSaveErr(e?.message ?? "Cloud save failed (saved locally).");
    } finally {
      setSaving(false);
    }
  }

  function resetPuzzle(id: number) {
    const def = DEFAULT_PUZZLES.find((d) => d.id === id)!;
    setPuzzles((prev) => prev.map((p) => (p.id === id ? structuredClone(def) : p)));
  }

  async function resetAll() {
    if (!confirm("Reset ALL puzzle content to defaults?")) return;
    clearOverrides();
    setPuzzles(structuredClone(DEFAULT_PUZZLES));
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
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        await saveOverridesToCloud(parsed);
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

  // re-sync from local cache if overrides changed via another tab
  useEffect(() => {
    const h = () => {
      const o = getOverrides();
      void o;
      setPuzzles(getPuzzles());
    };
    window.addEventListener("be_content", h);
    return () => window.removeEventListener("be_content", h);
  }, []);

  return (
    <div className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display text-xs uppercase tracking-widest text-gold">
              Host Admin
            </div>
            <h1 className="font-display text-3xl md:text-4xl">Puzzle Editor</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Edits sync to the cloud — players on any device get the latest content.
            </p>
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
          <div className="min-w-[260px]">
            <div className="font-display text-xs uppercase tracking-widest text-gold">
              Vault word (9 letters)
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Input
                value={vaultWord}
                maxLength={9}
                onChange={(e) =>
                  setVaultWord(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 9))
                }
                className="h-11 w-44 text-center font-display text-xl tracking-[0.3em] uppercase border-gold/50"
                placeholder={DEFAULT_VAULT_WORD}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setVaultWord(DEFAULT_VAULT_WORD)}
                title="Reset to default"
              >
                Default
              </Button>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {vaultWordValid
                ? "Letters auto-scramble across the 9 locks. Players unscramble to win."
                : "Enter exactly 9 letters (A–Z). No spaces."}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={save}
              disabled={saving || !vaultWordValid}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              {saving ? "Saving…" : "Save changes"}
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
        {savedAt && <div className="text-xs text-gold mt-2">Saved at {savedAt}</div>}
        {saveErr && <div className="text-xs text-destructive mt-2">{saveErr}</div>}

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

        <IntroEditor
          introText={introText}
          onChange={setIntroText}
          onReset={() => setIntroText(DEFAULT_INTRO_TEXT)}
        />

        <NarrationStatusPanel introText={introText} puzzles={puzzles} />

        <div className="mt-6 space-y-6">
          {puzzles.map((p) => (
            <PuzzleEditor
              key={p.id}
              puzzle={p}
              onChange={(patch) => update(p.id, patch)}
              onReset={() => resetPuzzle(p.id)}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={save} disabled={saving} className="bg-gold text-gold-foreground hover:bg-gold/90">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ----------------- Narration: triggers + UI ----------------- */

async function triggerAllNarrations(introText: string, puzzles: Puzzle[]) {
  const trimmedIntro = (introText || DEFAULT_INTRO_TEXT).trim();
  const jobs: Array<{ key: string; text: string }> = [
    { key: INTRO_KEY, text: trimmedIntro },
    ...puzzles.map((p) => ({ key: puzzleNarrationKey(p.id), text: p.flavor.trim() })),
  ];
  // Fire sequentially to be polite to ElevenLabs rate limits.
  for (const job of jobs) {
    if (!job.text) continue;
    try {
      await generateNarration({ data: job });
    } catch (e) {
      console.warn("Narration generation failed for", job.key, e);
    }
  }
}

function IntroEditor({
  introText,
  onChange,
  onReset,
}: {
  introText: string;
  onChange: (v: string) => void;
  onReset: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  async function regen() {
    setGenerating(true);
    try {
      await generateNarration({ data: { key: INTRO_KEY, text: introText.trim() } });
    } catch (e) {
      console.warn("Intro narration regen failed", e);
    } finally {
      setGenerating(false);
    }
  }
  return (
    <div className="stone-panel mt-4 rounded-xl p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="font-display text-xs uppercase tracking-widest text-gold">
          Home page intro story (Puzzle Master narration)
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onReset}>
            Use default
          </Button>
          <Button size="sm" variant="outline" onClick={regen} disabled={generating || !introText.trim()}>
            {generating ? "Generating…" : "Regenerate audio now"}
          </Button>
        </div>
      </div>
      <Textarea
        value={introText}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder={DEFAULT_INTRO_TEXT}
        className="mt-2"
      />
      <p className="text-xs text-muted-foreground mt-2">
        This is read aloud by the Puzzle Master on the home page. Audio regenerates automatically when you press
        <strong> Save changes</strong> if the text has changed.
      </p>
    </div>
  );
}

function NarrationStatusPanel({
  introText,
  puzzles,
}: {
  introText: string;
  puzzles: Puzzle[];
}) {
  const [rows, setRows] = useState<NarrationRow[]>([]);

  // Initial load + realtime subscription
  useEffect(() => {
    let alive = true;
    fetchAllNarrations().then((r) => alive && setRows(r));
    const channel = supabase
      .channel("narrations-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "narrations" },
        () => {
          fetchAllNarrations().then((r) => alive && setRows(r));
        },
      )
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const byKey = useMemo(() => {
    const m = new Map<string, NarrationRow>();
    rows.forEach((r) => m.set(r.key, r));
    return m;
  }, [rows]);

  const items: Array<{ key: string; label: string; text: string }> = [
    { key: INTRO_KEY, label: "Home intro", text: (introText || DEFAULT_INTRO_TEXT).trim() },
    ...puzzles.map((p) => ({
      key: puzzleNarrationKey(p.id),
      label: `Lock ${p.id} — ${p.title}`,
      text: p.flavor.trim(),
    })),
  ];

  // Track which keys we (this admin tab) are actively generating right now,
  // so the UI shows real per-row progress instead of the DB's stale "pending".
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [lastError, setLastError] = useState<string>("");

  async function regenOne(key: string, text: string) {
    if (!text || activeKey) return;
    setActiveKey(key);
    setLastError("");
    try {
      await generateNarration({ data: { key, text } });
    } catch (e: any) {
      console.warn("regen failed", key, e);
      setLastError(`${key}: ${e?.message ?? "failed"}`);
    } finally {
      setActiveKey(null);
    }
  }

  // True for items missing audio OR whose text changed since last generation.
  const stale = items.filter((it) => {
    const row = byKey.get(it.key);
    if (!row || !row.audio_url || row.status !== "ready") return true;
    return row.text.trim() !== it.text;
  });
  const bulkRunning = bulkProgress !== null;
  async function generateAllStale() {
    if (bulkRunning || stale.length === 0) return;
    const queue = stale.filter((it) => it.text);
    setLastError("");
    setBulkProgress({ done: 0, total: queue.length });
    let done = 0;
    for (const it of queue) {
      setActiveKey(it.key);
      try {
        await generateNarration({ data: { key: it.key, text: it.text } });
      } catch (e: any) {
        console.warn("bulk regen failed for", it.key, e);
        setLastError(`${it.key}: ${e?.message ?? "failed"}`);
      }
      done += 1;
      setBulkProgress({ done, total: queue.length });
    }
    setActiveKey(null);
    setBulkProgress(null);
  }

  return (
    <div className="stone-panel mt-4 rounded-xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-gold" />
          <div className="font-display text-xs uppercase tracking-widest text-gold">
            Puzzle Master narration status
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={generateAllStale}
          disabled={bulkRunning || stale.length === 0}
          className="border-gold/40"
        >
          {bulkRunning
            ? `Generating ${bulkProgress!.done + 1} of ${bulkProgress!.total}…`
            : stale.length === 0
              ? "All voices ready"
              : `Generate ${stale.length} missing voice${stale.length === 1 ? "" : "s"}`}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Audio is generated <strong>one at a time</strong> (about 5–15s each) to stay within
        ElevenLabs rate limits — running them all together is safe. Audio is cached and only
        regenerates when text changes or you click a button here. Players never trigger generation.
      </p>
      {bulkRunning && (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded bg-background/40">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${(bulkProgress!.done / bulkProgress!.total) * 100}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {bulkProgress!.done} / {bulkProgress!.total} complete
          </div>
        </div>
      )}
      {lastError && (
        <div className="mt-2 text-xs text-destructive">Last error → {lastError}</div>
      )}
      <div className="mt-3 grid gap-2">
        {items.map((it) => {
          const row = byKey.get(it.key);
          const isActive = activeKey === it.key;
          const isQueued = bulkRunning && !isActive && stale.some((s) => s.key === it.key);
          const upToDate =
            !!row?.audio_url &&
            row.status === "ready" &&
            row.text.trim() === it.text;
          return (
            <div
              key={it.key}
              className="flex flex-wrap items-center gap-3 rounded border border-border bg-background/40 p-2"
            >
              <div className="min-w-[180px] text-sm">{it.label}</div>
              <div className="flex-1 min-w-[160px] flex items-center gap-2 text-xs">
                {isActive ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-gold" />
                    <span className="text-gold">Generating now…</span>
                  </>
                ) : isQueued ? (
                  <span className="text-muted-foreground italic">Queued…</span>
                ) : row?.status === "error" ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-destructive truncate">{row?.error ?? "Error"}</span>
                  </>
                ) : upToDate ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-gold" />
                    <span className="text-muted-foreground">Up to date</span>
                  </>
                ) : row?.audio_url ? (
                  <span className="text-muted-foreground italic">
                    Out of date — regenerate to refresh
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">Not generated yet</span>
                )}
              </div>
              {row?.audio_url && (
                <audio controls src={row.audio_url} className="h-8 max-w-[220px]" />
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => regenOne(it.key, it.text)}
                disabled={!it.text || isActive || isQueued}
              >
                Regenerate
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PuzzleEditor({
  puzzle,
  onChange,
  onReset,
}: {
  puzzle: Puzzle;
  onChange: (patch: Partial<Puzzle>) => void;
  onReset: () => void;
}) {
  function setHints(next: Hint[]) {
    onChange({ hints: next });
  }
  return (
    <div className="stone-panel rounded-xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="font-display text-gold">
          Lock {puzzle.id} — Letter{" "}
          <span className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded border border-gold/50 bg-background/40">
            {puzzle.artifact}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset to default
        </Button>
      </div>

      {/* Letter readout — auto-derived from the vault word above */}
      <div className="mt-4 rounded border border-gold/40 bg-gold/5 p-3">
        <div className="text-xs font-display uppercase tracking-widest text-gold">
          Scrambled letter (auto-assigned)
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded border border-gold/50 bg-background/40 font-display text-2xl text-gold">
            {puzzle.artifact}
          </div>
          <p className="text-xs text-muted-foreground">
            This letter is dealt automatically from the vault word above. Change the
            vault word to re-deal letters across all nine locks.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="Title">
          <Input value={puzzle.title} onChange={(e) => onChange({ title: e.target.value })} />
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
        <Field label="Single-answer (used when no questions below)">
          <Input value={puzzle.answer} onChange={(e) => onChange({ answer: e.target.value })} />
        </Field>
        <Field label="Acceptable alternates (comma-separated)">
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

      {/* Hints */}
      <div className="mt-4 space-y-2">
        <div className="font-display text-xs uppercase tracking-widest text-gold">Hints</div>
        {puzzle.hints.map((h, i) => (
          <div key={h.tier} className="rounded border border-border bg-background/30 p-3">
            <div className="grid gap-2 md:grid-cols-[120px_1fr]">
              <Input
                value={h.label}
                onChange={(e) => {
                  const next = [...puzzle.hints];
                  next[i] = { ...h, label: e.target.value };
                  setHints(next);
                }}
                placeholder={`Hint ${h.tier} label`}
              />
              <Textarea
                value={h.text}
                onChange={(e) => {
                  const next = [...puzzle.hints];
                  next[i] = { ...h, text: e.target.value };
                  setHints(next);
                }}
                rows={2}
                placeholder={`Hint ${h.tier} text`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Multi-question editor */}
      {MULTI_Q_PUZZLES.has(puzzle.id) && (
        <QuestionsEditor
          puzzleId={puzzle.id}
          questions={puzzle.questions ?? puzzle.musicQuestions ?? []}
          allowAudio={puzzle.id === 8}
          onChange={(next) => {
            const patch: Partial<Puzzle> = { questions: next };
            if (puzzle.id === 8) patch.musicQuestions = next;
            onChange(patch);
          }}
        />
      )}

      {/* Hidden-scene editor for puzzle 2 */}
      {puzzle.id === 2 && (
        <HiddenSceneEditor
          scene={puzzle.hiddenScene ?? { imageUrl: cathedralMural, markers: [] }}
          onChange={(scene) => onChange({ hiddenScene: scene })}
        />
      )}

      {/* Path-of-righteous editor for puzzle 4 */}
      {puzzle.id === 4 && puzzle.pathConfig && (
        <PathConfigEditor
          config={puzzle.pathConfig}
          onChange={(pc) => onChange({ pathConfig: pc })}
        />
      )}

      {/* Library editor for puzzle 3 */}
      {puzzle.id === 3 && (
        <LibraryEditor
          config={puzzle.libraryConfig ?? { books: [], intro: "" }}
          onChange={(c) => onChange({ libraryConfig: c })}
        />
      )}

      {/* Stained Glass editor for puzzle 7 */}
      {puzzle.id === 7 && (
        <StainedGlassEditor
          config={
            puzzle.stainedGlassConfig ?? {
              imageUrl: stainedGlassImg,
              letters: ["", "", "", "", "", "", "", "", ""],
              revealedWord: "",
              intro: "",
            }
          }
          onChange={(c) => onChange({ stainedGlassConfig: c })}
        />
      )}

      {/* Timeline editor for puzzle 9 */}
      {puzzle.id === 9 && (
        <TimelineEditor
          config={
            puzzle.timelineConfig ?? { events: [], intro: "", finalCode: puzzle.answer ?? "" }
          }
          onChange={(c) => onChange({ timelineConfig: c })}
        />
      )}
    </div>
  );
}

/* ----------------- Generic Questions editor ----------------- */
function QuestionsEditor({
  puzzleId,
  questions,
  allowAudio,
  onChange,
}: {
  puzzleId: number;
  questions: Question[];
  allowAudio: boolean;
  onChange: (next: Question[]) => void;
}) {
  function update(idx: number, patch: Partial<Question>) {
    onChange(questions.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }
  function add() {
    onChange([...questions, { prompt: "", answer: "", acceptable: [], hint: "", audioUrl: "" }]);
  }
  function remove(idx: number) {
    onChange(questions.filter((_, i) => i !== idx));
  }
  function move(idx: number, dir: -1 | 1) {
    const next = [...questions];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }

  return (
    <div className="mt-6 rounded border border-gold/30 bg-background/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-display text-xs uppercase tracking-widest text-gold">
          Questions ({questions.length}) — players answer in order, −30s per wrong
        </div>
        <Button size="sm" variant="outline" onClick={add}>
          + Add question
        </Button>
      </div>
      {questions.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No questions yet — uses the single-answer field above.
        </p>
      )}
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="rounded border border-border bg-background/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Question {i + 1}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => move(i, -1)} disabled={i === 0}>
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => move(i, 1)}
                  disabled={i === questions.length - 1}
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/50 text-destructive"
                  onClick={() => remove(i)}
                >
                  Remove
                </Button>
              </div>
            </div>
            <Field label="Prompt">
              <Textarea
                value={q.prompt}
                onChange={(e) => update(i, { prompt: e.target.value })}
                rows={2}
              />
            </Field>
            <div className="grid gap-2 md:grid-cols-2">
              <Field label="Canonical answer">
                <Input value={q.answer} onChange={(e) => update(i, { answer: e.target.value })} />
              </Field>
              <Field label="Hint (optional)">
                <Input
                  value={q.hint ?? ""}
                  onChange={(e) => update(i, { hint: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Acceptable alternates (comma-separated)">
              <Input
                value={(q.acceptable ?? []).join(", ")}
                onChange={(e) =>
                  update(i, {
                    acceptable: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </Field>
            {allowAudio && (
              <AudioUploader
                puzzleId={puzzleId}
                qIdx={i}
                audioUrl={q.audioUrl ?? ""}
                onChange={(audioUrl) => update(i, { audioUrl })}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AudioUploader({
  puzzleId,
  qIdx,
  audioUrl,
  onChange,
}: {
  puzzleId: number;
  qIdx: number;
  audioUrl: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  async function handleFile(file: File) {
    setUploading(true);
    setErr("");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
      const path = `puzzle${puzzleId}/q${qIdx + 1}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("music-round")
        .upload(path, file, { upsert: true, contentType: file.type || "audio/mpeg" });
      if (error) throw error;
      const { data } = supabase.storage.from("music-round").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e: any) {
      setErr(e.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  }
  return (
    <Field label="Audio clip (MP3, optional)">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex">
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
            disabled={uploading}
          />
          <span className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input bg-background px-3 text-sm hover:bg-accent">
            {uploading ? "Uploading…" : audioUrl ? "Replace MP3" : "Upload MP3"}
          </span>
        </label>
        {audioUrl && (
          <>
            <audio controls src={audioUrl} className="h-9 max-w-xs" />
            <Button variant="outline" size="sm" onClick={() => onChange("")}>
              Remove
            </Button>
          </>
        )}
      </div>
      {err && <div className="text-xs text-destructive mt-1">{err}</div>}
    </Field>
  );
}

/* ----------------- Hidden Scene editor (puzzle 2) ----------------- */
function HiddenSceneEditor({
  scene,
  onChange,
}: {
  scene: HiddenScene;
  onChange: (scene: HiddenScene) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  async function handleImage(file: File) {
    setUploading(true);
    setErr("");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `scene-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("hidden-scenes")
        .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
      if (error) throw error;
      const { data } = supabase.storage.from("hidden-scenes").getPublicUrl(path);
      onChange({ ...scene, imageUrl: data.publicUrl });
    } catch (e: any) {
      setErr(e.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function addMarker(emoji: string) {
    const m: HiddenMarker = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      emoji,
      x: 50,
      y: 50,
      radius: 8,
      label: emoji,
    };
    onChange({ ...scene, markers: [...scene.markers, m] });
  }

  function updateMarker(id: string, patch: Partial<HiddenMarker>) {
    onChange({
      ...scene,
      markers: scene.markers.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });
  }

  function removeMarker(id: string) {
    onChange({ ...scene, markers: scene.markers.filter((m) => m.id !== id) });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingId || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    updateMarker(draggingId, { x, y });
  }

  const QUICK_EMOJIS = ["🕊️", "🐟", "✝️", "🐑", "🍞", "🔥", "👑", "📜", "🌿", "⭐"];

  return (
    <div className="mt-6 rounded border border-gold/30 bg-background/20 p-4 space-y-3">
      <div className="font-display text-xs uppercase tracking-widest text-gold">
        Hidden scene — drag markers to position. Click on canvas does NOT add (use buttons below).
      </div>

      <Field label="Background image">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImage(f);
                e.target.value = "";
              }}
              disabled={uploading}
            />
            <span className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input bg-background px-3 text-sm hover:bg-accent">
              {uploading ? "Uploading…" : "Upload image"}
            </span>
          </label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...scene, imageUrl: cathedralMural })}
          >
            Use default cathedral
          </Button>
          <Input
            placeholder="…or paste image URL"
            value={scene.imageUrl}
            onChange={(e) => onChange({ ...scene, imageUrl: e.target.value })}
            className="max-w-md"
          />
        </div>
        {err && <div className="text-xs text-destructive mt-1">{err}</div>}
      </Field>

      <div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDraggingId(null)}
        onPointerLeave={() => setDraggingId(null)}
        className="relative w-full overflow-hidden rounded-lg border border-gold/40 bg-background/40 select-none"
        style={{ aspectRatio: "16/9", touchAction: "none" }}
      >
        {scene.imageUrl ? (
          <img
            src={scene.imageUrl}
            alt="scene"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm">
            No image set
          </div>
        )}

        {scene.markers.map((m) => (
          <div
            key={m.id}
            onPointerDown={(e) => {
              e.preventDefault();
              setDraggingId(m.id);
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move group"
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
          >
            {/* Radius ring */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/60 bg-gold/10 pointer-events-none"
              style={{
                width: `${m.radius * 2}%`,
                height: `${m.radius * 2 * (16 / 9)}%`, // approximate visual ring (image is 16:9)
                left: 0,
                top: 0,
              }}
            />
            <span className="text-3xl drop-shadow-[0_0_8px_black] block">{m.emoji}</span>
          </div>
        ))}
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          Add marker
        </div>
        <div className="flex flex-wrap gap-1">
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => addMarker(e)}
              className="h-9 w-9 rounded border border-border hover:border-gold text-xl"
              type="button"
            >
              {e}
            </button>
          ))}
          <CustomEmojiAdd onAdd={addMarker} />
        </div>
      </div>

      <div className="space-y-2">
        {scene.markers.map((m) => (
          <div
            key={m.id}
            className="grid gap-2 md:grid-cols-[60px_1fr_1fr_1fr_1fr_auto] items-center rounded border border-border bg-background/40 p-2"
          >
            <Input
              value={m.emoji}
              onChange={(e) => updateMarker(m.id, { emoji: e.target.value })}
              className="text-center text-lg"
            />
            <Input
              value={m.label ?? ""}
              onChange={(e) => updateMarker(m.id, { label: e.target.value })}
              placeholder="label"
            />
            <NumberField
              label="x %"
              value={m.x}
              min={0}
              max={100}
              onChange={(v) => updateMarker(m.id, { x: v })}
            />
            <NumberField
              label="y %"
              value={m.y}
              min={0}
              max={100}
              onChange={(v) => updateMarker(m.id, { y: v })}
            />
            <NumberField
              label="radius"
              value={m.radius}
              min={1}
              max={30}
              onChange={(v) => updateMarker(m.id, { radius: v })}
            />
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/50 text-destructive"
              onClick={() => removeMarker(m.id)}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomEmojiAdd({ onAdd }: { onAdd: (s: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex items-center gap-1">
      <Input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="emoji or text"
        className="h-9 w-32"
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          if (v.trim()) {
            onAdd(v.trim());
            setV("");
          }
        }}
      >
        Add
      </Button>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="text-xs">
      <div className="text-muted-foreground">{label}</div>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={1}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
        className="h-8"
      />
    </label>
  );
}

/* ----------------- Path Config editor (puzzle 4) ----------------- */
function PathConfigEditor({
  config,
  onChange,
}: {
  config: PathConfig;
  onChange: (pc: PathConfig) => void;
}) {
  // Normalize each row entry into a number[] for editing convenience.
  function rowAsArray(row: number): number[] {
    const v = config.safeCols[row];
    if (v === undefined || v === null) return [];
    return Array.isArray(v) ? [...v] : [v];
  }

  function toggleCell(row: number, col: number) {
    const next: Array<number | number[]> = config.safeCols.map((v) =>
      Array.isArray(v) ? [...v] : v,
    );
    const current = rowAsArray(row);
    const has = current.includes(col);
    const updated = has ? current.filter((c) => c !== col) : [...current, col].sort((a, b) => a - b);
    // Store as plain number when only one safe stone, otherwise as array.
    next[row] = updated.length === 1 ? updated[0] : updated;
    onChange({ ...config, safeCols: next });
  }

  function setRows(rows: number) {
    rows = Math.max(3, Math.min(30, rows));
    const safeCols: Array<number | number[]> = config.safeCols.map((v) =>
      Array.isArray(v) ? [...v] : v,
    );
    while (safeCols.length < rows) safeCols.push(Math.floor(config.cols / 2));
    while (safeCols.length > rows) safeCols.pop();
    onChange({ ...config, rows, safeCols });
  }
  function setCols(cols: number) {
    cols = Math.max(3, Math.min(15, cols));
    const safeCols: Array<number | number[]> = config.safeCols.map((v) => {
      if (Array.isArray(v)) {
        const filtered = v.filter((c) => c < cols);
        return filtered.length === 1 ? filtered[0] : filtered.length === 0 ? 0 : filtered;
      }
      return Math.min(v, cols - 1);
    });
    onChange({ ...config, cols, safeCols });
  }

  return (
    <div className="mt-6 rounded border border-gold/30 bg-background/20 p-4 space-y-3">
      <div className="font-display text-xs uppercase tracking-widest text-gold">
        Path of the Righteous — click cells to toggle safe stones (multiple per row allowed for branching/looping paths)
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <NumberField label="Rows (path length)" value={config.rows} min={3} max={30} onChange={setRows} />
        <NumberField label="Columns (grid width)" value={config.cols} min={3} max={15} onChange={setCols} />
        <NumberField
          label="Preview seconds"
          value={config.previewSeconds}
          min={1}
          max={30}
          onChange={(v) => onChange({ ...config, previewSeconds: v })}
        />
      </div>
      <div
        className="mx-auto grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
          maxWidth: Math.min(560, config.cols * 56),
        }}
      >
        {Array.from({ length: config.rows * config.cols }).map((_, i) => {
          const row = Math.floor(i / config.cols);
          const col = i % config.cols;
          const isSafe = rowAsArray(row).includes(col);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggleCell(row, col)}
              className={`aspect-square rounded border transition ${
                isSafe
                  ? "border-gold bg-gold/40 shadow-[0_0_6px_rgba(212,175,55,0.6)]"
                  : "border-border/60 bg-background/30 hover:border-gold/40"
              }`}
              aria-label={`r${row}c${col}${isSafe ? " (safe)" : ""}`}
            />
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Click any cell to toggle it as safe. You can mark <strong>multiple</strong> safe stones per row to create
        looping or branching paths. Players see safe stones lit for {config.previewSeconds}s, then they hide.
        Wrong stone = −30s. Asking to see the path again = −2 minutes.
      </p>
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

/* ----------------- Library editor (puzzle 3) ----------------- */
function LibraryEditor({
  config,
  onChange,
}: {
  config: LibraryConfig;
  onChange: (c: LibraryConfig) => void;
}) {
  function update(idx: number, patch: Partial<LibraryBook>) {
    onChange({
      ...config,
      books: config.books.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    });
  }
  function add() {
    const id = `book-${Date.now()}`;
    onChange({ ...config, books: [...config.books, { id, name: "", real: false }] });
  }
  function remove(idx: number) {
    onChange({ ...config, books: config.books.filter((_, i) => i !== idx) });
  }
  function move(idx: number, dir: -1 | 1) {
    const next = [...config.books];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange({ ...config, books: next });
  }

  return (
    <div className="mt-6 rounded border border-gold/30 bg-background/20 p-4 space-y-3">
      <div className="font-display text-xs uppercase tracking-widest text-gold">
        Library — books on display. Mark which are real and the order to pick them in.
      </div>
      <Field label="Intro text shown to players">
        <Textarea
          value={config.intro ?? ""}
          onChange={(e) => onChange({ ...config, intro: e.target.value })}
          rows={2}
        />
      </Field>
      <div className="space-y-2">
        {config.books.map((b, i) => (
          <div
            key={b.id}
            className="grid gap-2 md:grid-cols-[1fr_90px_90px_auto] items-center rounded border border-border bg-background/40 p-2"
          >
            <Input
              value={b.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Book name"
            />
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={b.real}
                onChange={(e) => update(i, { real: e.target.checked })}
              />
              Real book
            </label>
            <NumberField
              label="order"
              value={b.order ?? 0}
              min={0}
              max={20}
              onChange={(v) => update(i, { order: v || undefined })}
            />
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => move(i, 1)}
                disabled={i === config.books.length - 1}
              >
                ↓
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/50 text-destructive"
                onClick={() => remove(i)}
              >
                ✕
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" onClick={add}>
        + Add book
      </Button>
      <p className="text-xs text-muted-foreground">
        Real books must have a unique <code>order</code> (1, 2, 3…). Fake books are decoys — picking
        them costs −30s.
      </p>
    </div>
  );
}

/* ----------------- Stained Glass editor (puzzle 7) ----------------- */
function StainedGlassEditor({
  config,
  onChange,
}: {
  config: StainedGlassConfig;
  onChange: (c: StainedGlassConfig) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const letters = config.letters.length === 9 ? config.letters : ["", "", "", "", "", "", "", "", ""];

  async function handleImage(file: File) {
    setUploading(true);
    setErr("");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `stained-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("hidden-scenes")
        .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
      if (error) throw error;
      const { data } = supabase.storage.from("hidden-scenes").getPublicUrl(path);
      onChange({ ...config, imageUrl: data.publicUrl });
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function setLetter(i: number, v: string) {
    const next = [...letters];
    next[i] = v.slice(0, 1).toUpperCase();
    onChange({ ...config, letters: next });
  }

  return (
    <div className="mt-6 rounded border border-gold/30 bg-background/20 p-4 space-y-3">
      <div className="font-display text-xs uppercase tracking-widest text-gold">
        Stained Glass — 3×3 image and letters revealed when solved
      </div>
      <Field label="Intro text shown to players">
        <Textarea
          value={config.intro ?? ""}
          onChange={(e) => onChange({ ...config, intro: e.target.value })}
          rows={2}
        />
      </Field>
      <Field label="Background image (sliced 3×3)">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImage(f);
                e.target.value = "";
              }}
              disabled={uploading}
            />
            <span className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input bg-background px-3 text-sm hover:bg-accent">
              {uploading ? "Uploading…" : "Upload image"}
            </span>
          </label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...config, imageUrl: stainedGlassImg })}
          >
            Use default stained glass
          </Button>
          <Input
            placeholder="…or paste image URL"
            value={config.imageUrl}
            onChange={(e) => onChange({ ...config, imageUrl: e.target.value })}
            className="max-w-md"
          />
        </div>
        {err && <div className="text-xs text-destructive mt-1">{err}</div>}
      </Field>
      <Field label="Revealed word (display only — players type the puzzle answer above)">
        <Input
          value={config.revealedWord}
          onChange={(e) => onChange({ ...config, revealedWord: e.target.value })}
          placeholder="e.g. TRUTH"
        />
      </Field>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          Letter on each piece (left→right, top→bottom of solved image)
        </div>
        <div
          className="mx-auto grid grid-cols-3 gap-2"
          style={{ maxWidth: 300 }}
        >
          {letters.map((l, i) => (
            <div
              key={i}
              className="relative aspect-square rounded border border-gold/40 bg-background/40 overflow-hidden"
              style={{
                backgroundImage: config.imageUrl ? `url(${config.imageUrl})` : undefined,
                backgroundSize: "300% 300%",
                backgroundPosition: `${(i % 3) * 50}% ${Math.floor(i / 3) * 50}%`,
              }}
            >
              <Input
                value={l}
                onChange={(e) => setLetter(i, e.target.value)}
                maxLength={1}
                className="absolute inset-0 h-full w-full bg-background/60 text-center font-display text-2xl text-gold"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ----------------- Timeline editor (puzzle 9) ----------------- */
function TimelineEditor({
  config,
  onChange,
}: {
  config: TimelineConfig;
  onChange: (c: TimelineConfig) => void;
}) {
  function update(idx: number, patch: Partial<TimelineEvent>) {
    onChange({
      ...config,
      events: config.events.map((e, i) => (i === idx ? { ...e, ...patch } : e)),
    });
  }
  function add() {
    const id = `evt-${Date.now()}`;
    onChange({ ...config, events: [...config.events, { id, label: "", belongs: false }] });
  }
  function remove(idx: number) {
    onChange({ ...config, events: config.events.filter((_, i) => i !== idx) });
  }
  function move(idx: number, dir: -1 | 1) {
    const next = [...config.events];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange({ ...config, events: next });
  }

  return (
    <div className="mt-6 rounded border border-gold/30 bg-background/20 p-4 space-y-3">
      <div className="font-display text-xs uppercase tracking-widest text-gold">
        Timeline — events on the board. Mark which belong and their order.
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Intro text shown to players">
          <Textarea
            value={config.intro ?? ""}
            onChange={(e) => onChange({ ...config, intro: e.target.value })}
            rows={2}
          />
        </Field>
        <Field label="Final code players type to lock it in">
          <Input
            value={config.finalCode}
            onChange={(e) => onChange({ ...config, finalCode: e.target.value })}
            placeholder="e.g. 12345"
          />
        </Field>
      </div>
      <div className="space-y-2">
        {config.events.map((ev, i) => (
          <div
            key={ev.id}
            className="grid gap-2 md:grid-cols-[1fr_110px_90px_auto] items-center rounded border border-border bg-background/40 p-2"
          >
            <Input
              value={ev.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Event label"
            />
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={ev.belongs}
                onChange={(e) => update(i, { belongs: e.target.checked })}
              />
              Belongs
            </label>
            <NumberField
              label="order"
              value={ev.order ?? 0}
              min={0}
              max={20}
              onChange={(v) => update(i, { order: v || undefined })}
            />
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => move(i, 1)}
                disabled={i === config.events.length - 1}
              >
                ↓
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/50 text-destructive"
                onClick={() => remove(i)}
              >
                ✕
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" onClick={add}>
        + Add event
      </Button>
      <p className="text-xs text-muted-foreground">
        Belonging events need a unique <code>order</code> (1, 2, 3…). Imposters cost −30s when picked
        as part of the order.
      </p>
    </div>
  );
}
