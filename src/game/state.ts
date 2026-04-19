import { useEffect, useState, useCallback } from "react";
import { GAME_DURATION_SECONDS } from "./content";

const KEYS = {
  team: "be_team",
  start: "be_start",
  penalty: "be_penalty",
  solved: "be_solved",
  finished: "be_finished",
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
export function startGame(name: string) {
  write(KEYS.team, name);
  write(KEYS.start, Date.now());
  write(KEYS.penalty, 0);
  write(KEYS.solved, []);
  write(KEYS.finished, false);
}
export function resetGame() {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
  window.dispatchEvent(new Event("be_state"));
}
export function getSolved(): number[] {
  return read<number[]>(KEYS.solved, []);
}
export function isUnlocked(id: number): boolean {
  // Strictly sequential: lock N is unlocked iff 1..N-1 are all solved.
  const solved = new Set(getSolved());
  for (let i = 1; i < id; i++) if (!solved.has(i)) return false;
  return true;
}
export function markSolved(id: number) {
  const s = new Set(getSolved());
  s.add(id);
  write(KEYS.solved, Array.from(s).sort((a, b) => a - b));
}
export function addPenalty(seconds: number) {
  const cur = read<number>(KEYS.penalty, 0);
  write(KEYS.penalty, cur + seconds);
}
export function getRemainingSeconds(): number {
  const start = read<number>(KEYS.start, 0);
  const penalty = read<number>(KEYS.penalty, 0);
  if (!start) return GAME_DURATION_SECONDS;
  const elapsed = Math.floor((Date.now() - start) / 1000) + penalty;
  return Math.max(0, GAME_DURATION_SECONDS - elapsed);
}
export function isGameStarted() {
  return read<number>(KEYS.start, 0) > 0;
}
export function setFinished(v: boolean) {
  write(KEYS.finished, v);
}
export function isFinished() {
  return read<boolean>(KEYS.finished, false);
}
export function getElapsedFormatted() {
  const start = read<number>(KEYS.start, 0);
  if (!start) return "00:00";
  const penalty = read<number>(KEYS.penalty, 0);
  const elapsed = Math.floor((Date.now() - start) / 1000) + penalty;
  return formatTime(elapsed);
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
