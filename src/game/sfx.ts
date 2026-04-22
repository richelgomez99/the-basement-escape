// Tiny SFX player. Respects the existing `be_narration_muted` flag so the
// host's mute toggle silences narration AND sfx together.
import lockUrl from "@/assets/sfx/lock.mp3";
import errorUrl from "@/assets/sfx/error.mp3";
import tickUrl from "@/assets/sfx/tick.mp3";

const URLS: Record<SfxName, string> = {
  lock: lockUrl,
  error: errorUrl,
  tick: tickUrl,
};

export type SfxName = "lock" | "error" | "tick";

const MUTE_KEY = "be_narration_muted";
function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

// Cache HTMLAudioElements so playback is instant after first hit.
const cache = new Map<SfxName, HTMLAudioElement>();
function getAudio(name: SfxName): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  let a = cache.get(name);
  if (!a) {
    a = new Audio(URLS[name]);
    a.preload = "auto";
    cache.set(name, a);
  }
  return a;
}

export function playSfx(name: SfxName, volume = 0.6) {
  if (isMuted()) return;
  const a = getAudio(name);
  if (!a) return;
  try {
    a.currentTime = 0;
    a.volume = volume;
    void a.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

// --- Looping ticker (used by Timer at < 60s) ---
let tickerTimer: number | null = null;
export function startTicker() {
  if (typeof window === "undefined") return;
  if (tickerTimer !== null) return;
  // Tick once a second.
  const fire = () => playSfx("tick", 0.35);
  fire();
  tickerTimer = window.setInterval(fire, 1000);
}
export function stopTicker() {
  if (tickerTimer !== null) {
    window.clearInterval(tickerTimer);
    tickerTimer = null;
  }
}
