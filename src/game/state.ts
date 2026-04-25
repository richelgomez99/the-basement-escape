import { useEffect, useState, useCallback } from "react";
import { GAME_DURATION_SECONDS } from "./content";

const KEYS = {
  team: "be_team",
  start: "be_start",
  penalty: "be_penalty",
  solved: "be_solved",
  finished: "be_finished",
  sessionId: "be_session_id",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v == null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("be_state"));
}

export function getTeamName() {
  return read<string>(KEYS.team, "");
}
export function setTeamName(name: string) {
  write(KEYS.team, name);
}

// ---- Per-puzzle persisted state ----
const PSTATE_PREFIX = "be_pstate:";
export function getPuzzleState<T>(id: number, fallback: T): T {
  return read<T>(PSTATE_PREFIX + id, fallback);
}
export function setPuzzleState<T>(id: number, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PSTATE_PREFIX + id, JSON.stringify(value));
}
export function clearPuzzleState(id: number) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PSTATE_PREFIX + id);
}
function clearAllPuzzleState() {
  if (typeof window === "undefined") return;
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(PSTATE_PREFIX)) {
      window.localStorage.removeItem(k);
      i--;
    }
  }
}

// ---- Session tracking (private; admin reads via service role) ----
export function getSessionId(): string {
  return read<string>(KEYS.sessionId, "");
}
function setSessionId(id: string) {
  write(KEYS.sessionId, id);
}

async function createSessionRow(team: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  // Generate the id client-side so we don't need a SELECT policy on
  // game_sessions (we never want sessions readable by the public).
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("game_sessions").insert({
      id,
      team_name: team,
      outcome: "in_progress",
      user_agent: navigator.userAgent.slice(0, 500),
    });
    if (error) throw error;
    return id;
  } catch (e) {
    console.warn("Session create failed (continuing offline):", e);
    return null;
  }
}

type SessionPatch = {
  outcome?: "in_progress" | "victory" | "failure";
  finished_at?: string | null;
  elapsed_seconds?: number | null;
  penalty_seconds?: number;
  solved_count?: number;
};
async function updateSessionRow(patch: SessionPatch) {
  const id = getSessionId();
  if (!id) return;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.from("game_sessions").update(patch).eq("id", id);
  } catch (e) {
    console.warn("Session update failed:", e);
  }
}

export function startGame(name: string) {
  write(KEYS.team, name);
  write(KEYS.start, Date.now());
  write(KEYS.penalty, 0);
  write(KEYS.solved, []);
  write(KEYS.finished, false);
  if (typeof window !== "undefined") window.localStorage.removeItem("be_pause_start");
  clearAllPuzzleState();
  // Create the cloud session row, fire-and-forget.
  void (async () => {
    const id = await createSessionRow(name);
    if (id) setSessionId(id);
  })();
}

export function resetGame() {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
  window.localStorage.removeItem("be_pause_start");
  clearAllPuzzleState();
  window.dispatchEvent(new Event("be_state"));
}
export function getSolved(): number[] {
  return read<number[]>(KEYS.solved, []);
}
export function isUnlocked(id: number): boolean {
  const solved = new Set(getSolved());
  for (let i = 1; i < id; i++) if (!solved.has(i)) return false;
  return true;
}
export function markSolved(id: number) {
  const s = new Set(getSolved());
  const wasSolved = s.has(id);
  s.add(id);
  const arr = Array.from(s).sort((a, b) => a - b);
  write(KEYS.solved, arr);
  clearPuzzleState(id);
  if (!wasSolved) {
    void updateSessionRow({ solved_count: arr.length });
  }
}
export function addPenalty(seconds: number) {
  const cur = read<number>(KEYS.penalty, 0);
  const next = cur + seconds;
  write(KEYS.penalty, next);
  void updateSessionRow({ penalty_seconds: next });
}

// ---- Pause support ----
const PAUSE_KEY = "be_pause_start";
function getPauseStart(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(PAUSE_KEY);
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
export function isClockPaused(): boolean {
  return getPauseStart() > 0;
}
export function pauseClock() {
  if (typeof window === "undefined") return;
  if (getPauseStart()) return;
  window.localStorage.setItem(PAUSE_KEY, String(Date.now()));
  window.dispatchEvent(new Event("be_state"));
}
export function resumeClock() {
  if (typeof window === "undefined") return;
  const startedAt = getPauseStart();
  if (!startedAt) return;
  window.localStorage.removeItem(PAUSE_KEY);
  const pausedSecs = Math.floor((Date.now() - startedAt) / 1000);
  if (pausedSecs > 0) addPenalty(pausedSecs);
  window.dispatchEvent(new Event("be_state"));
}
export function getRemainingSeconds(): number {
  const start = read<number>(KEYS.start, 0);
  const penalty = read<number>(KEYS.penalty, 0);
  if (!start) return GAME_DURATION_SECONDS;
  const pauseStart = getPauseStart();
  const nowMs = pauseStart || Date.now();
  const elapsed = Math.floor((nowMs - start) / 1000) + penalty;
  return Math.max(0, GAME_DURATION_SECONDS - elapsed);
}
export function isGameStarted() {
  return read<number>(KEYS.start, 0) > 0;
}

export function getElapsedSecondsRaw(): number {
  const start = read<number>(KEYS.start, 0);
  if (!start) return 0;
  const penalty = read<number>(KEYS.penalty, 0);
  return Math.floor((Date.now() - start) / 1000) + penalty;
}

export function setFinished(v: boolean, outcome?: "victory" | "failure") {
  write(KEYS.finished, v);
  if (v && outcome) {
    const elapsed = getElapsedSecondsRaw();
    void updateSessionRow({
      outcome,
      finished_at: new Date().toISOString(),
      elapsed_seconds: elapsed,
      penalty_seconds: read<number>(KEYS.penalty, 0),
      solved_count: getSolved().length,
    });
  }
}
export function isFinished() {
  return read<boolean>(KEYS.finished, false);
}
export function getElapsedFormatted() {
  return formatTime(getElapsedSecondsRaw());
}

export function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function useCountdown() {
  const [remaining, setRemaining] = useState<number>(GAME_DURATION_SECONDS);
  const [solved, setSolved] = useState<number[]>([]);

  const refresh = useCallback(() => {
    setRemaining(getRemainingSeconds());
    setSolved(getSolved());
  }, []);

  useEffect(() => {
    refresh();
    const i = window.setInterval(refresh, 500);
    const h = () => refresh();
    window.addEventListener("be_state", h);
    window.addEventListener("storage", h);
    return () => {
      window.clearInterval(i);
      window.removeEventListener("be_state", h);
      window.removeEventListener("storage", h);
    };
  }, [refresh]);

  return { remaining, solved, formatted: formatTime(remaining) };
}
